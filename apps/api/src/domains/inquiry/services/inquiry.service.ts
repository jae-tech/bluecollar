import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { inquiries, workerProfiles, users } from '@repo/database';
import { and, eq, gte, count, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type {
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from '../dtos/inquiry.dto';
import { InquiryEmailService } from './inquiry-email.service';

/** 24시간 내 동일 클라이언트+워커 조합 최대 의뢰 건수 */
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly inquiryEmailService: InquiryEmailService,
  ) {}

  /**
   * 클라이언트가 워커에게 의뢰 제출
   *
   * 1. 워커 프로필 존재 확인 (workerSlug → workerProfileId)
   * 2. 24시간 3건 Rate limit 확인
   * 3. 의뢰 저장
   * 4. 워커에게 이메일 알림 발송 (fire-and-forget)
   *
   * @param clientUserId 의뢰하는 클라이언트의 user ID
   * @param workerSlug 워커 프로필 slug
   * @param dto 의뢰 데이터
   */
  async createInquiry(
    clientUserId: string,
    workerSlug: string,
    dto: CreateInquiryDto,
  ) {
    // 워커 프로필 조회 (slug → profile)
    const workerResult = await this.db
      .select({
        id: workerProfiles.id,
        businessName: workerProfiles.businessName,
        userId: workerProfiles.userId,
      })
      .from(workerProfiles)
      .where(eq(workerProfiles.slug, workerSlug))
      .limit(1);

    if (workerResult.length === 0) {
      throw new NotFoundException('워커 프로필을 찾을 수 없습니다');
    }

    const worker = workerResult[0];

    // 워커 이메일 조회 (알림 발송용)
    const workerUserResult = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, worker.userId))
      .limit(1);

    const workerEmail = workerUserResult[0]?.email;

    // 24시간 Rate limit 확인
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await this.db
      .select({ cnt: count() })
      .from(inquiries)
      .where(
        and(
          eq(inquiries.clientUserId, clientUserId),
          eq(inquiries.workerProfileId, worker.id),
          gte(inquiries.createdAt, windowStart),
        ),
      );

    if ((recentCount[0]?.cnt ?? 0) >= RATE_LIMIT_COUNT) {
      throw new HttpException(
        '동일 전문가에게 24시간 내 최대 3건까지 의뢰할 수 있습니다',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 의뢰 저장
    const [created] = await this.db
      .insert(inquiries)
      .values({
        clientUserId,
        workerProfileId: worker.id,
        name: dto.name,
        phone: dto.phone,
        location: dto.location,
        workType: dto.workType,
        budget: dto.budget,
        message: dto.message,
        projectTitle: dto.projectTitle,
        status: 'PENDING',
      })
      .returning();

    this.logger.log(
      { inquiryId: created.id, clientUserId, workerProfileId: worker.id },
      '의뢰 생성 완료',
    );

    // 워커 이메일 알림 — fire-and-forget (실패해도 의뢰 저장은 성공으로 처리)
    if (workerEmail) {
      void this.inquiryEmailService
        .sendInquiryNotification({
          workerEmail,
          workerName: worker.businessName,
          clientName: dto.name,
          location: dto.location,
          workType: dto.workType,
          message: dto.message,
          inquiryId: created.id,
        })
        .catch((err: Error) =>
          this.logger.error(
            { err: err.message, inquiryId: created.id },
            '의뢰 알림 이메일 발송 실패 (비동기, 의뢰 저장은 정상)',
          ),
        );
    }

    return created;
  }

  /**
   * 워커 대시보드 — 자신에게 온 의뢰 목록 조회
   *
   * @param workerProfileId 워커 프로필 ID
   * @param status 상태 필터 (선택)
   * @param limit 페이지 크기
   * @param offset 오프셋
   */
  async getInquiriesForWorker(
    workerProfileId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) {
    const conditions = [eq(inquiries.workerProfileId, workerProfileId)];
    if (status) {
      conditions.push(
        eq(
          inquiries.status,
          status as
            | 'PENDING'
            | 'READ'
            | 'REPLIED'
            | 'ACCEPTED'
            | 'DECLINED'
            | 'CANCELLED',
        ),
      );
    }

    return this.db
      .select()
      .from(inquiries)
      .where(and(...conditions))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 클라이언트 — 자신이 보낸 의뢰 목록 조회
   *
   * @param clientUserId 클라이언트 user ID
   * @param status 상태 필터 (선택)
   * @param limit 페이지 크기
   * @param offset 오프셋
   */
  async getInquiriesForClient(
    clientUserId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) {
    const conditions = [eq(inquiries.clientUserId, clientUserId)];
    if (status) {
      conditions.push(
        eq(
          inquiries.status,
          status as
            | 'PENDING'
            | 'READ'
            | 'REPLIED'
            | 'ACCEPTED'
            | 'DECLINED'
            | 'CANCELLED',
        ),
      );
    }

    return this.db
      .select()
      .from(inquiries)
      .where(and(...conditions))
      .orderBy(desc(inquiries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 워커가 의뢰 상태 변경 (READ, REPLIED, ACCEPTED, DECLINED)
   *
   * @param inquiryId 의뢰 ID
   * @param workerProfileId 요청하는 워커의 프로필 ID (본인 의뢰인지 검증)
   * @param dto 상태 변경 데이터
   */
  async updateInquiryStatus(
    inquiryId: string,
    workerProfileId: string,
    dto: UpdateInquiryStatusDto,
  ) {
    const existing = await this.db
      .select({ id: inquiries.id, workerProfileId: inquiries.workerProfileId })
      .from(inquiries)
      .where(eq(inquiries.id, inquiryId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('의뢰를 찾을 수 없습니다');
    }

    if (existing[0].workerProfileId !== workerProfileId) {
      throw new ForbiddenException('본인의 의뢰만 수정할 수 있습니다');
    }

    const [updated] = await this.db
      .update(inquiries)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(inquiries.id, inquiryId))
      .returning();

    this.logger.log(
      { inquiryId, status: dto.status, workerProfileId },
      '의뢰 상태 변경',
    );

    return updated;
  }

  /**
   * 클라이언트가 의뢰 취소 (CANCELLED)
   *
   * @param inquiryId 의뢰 ID
   * @param clientUserId 요청하는 클라이언트 user ID (본인 의뢰인지 검증)
   */
  async cancelInquiry(inquiryId: string, clientUserId: string) {
    const existing = await this.db
      .select({
        id: inquiries.id,
        clientUserId: inquiries.clientUserId,
        status: inquiries.status,
      })
      .from(inquiries)
      .where(eq(inquiries.id, inquiryId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('의뢰를 찾을 수 없습니다');
    }

    if (existing[0].clientUserId !== clientUserId) {
      throw new ForbiddenException('본인의 의뢰만 취소할 수 있습니다');
    }

    if (existing[0].status === 'CANCELLED') {
      throw new ForbiddenException('이미 취소된 의뢰입니다');
    }

    const [cancelled] = await this.db
      .update(inquiries)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(inquiries.id, inquiryId))
      .returning();

    this.logger.log({ inquiryId, clientUserId }, '의뢰 취소 완료');

    return cancelled;
  }
}
