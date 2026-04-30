import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import {
  businessDocuments,
  manualReviews,
  workerProfiles,
  users,
} from '@repo/database';
import { eq, count, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type { DocumentListQueryDto } from '../dtos/admin.dto';
import { AdminAuditService } from './admin-audit.service';
import { AdminNotificationService } from './admin-notification.service';

/**
 * 관리자 사업자 서류 심사 서비스
 *
 * PENDING 상태의 사업자등록증을 승인/거절 처리합니다.
 * 승인 시 workerProfiles.businessVerified = true, manualReviews 생성,
 * 감사 로그 기록을 단일 트랜잭션으로 처리합니다.
 */
@Injectable()
export class AdminDocumentsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    private readonly auditService: AdminAuditService,
    private readonly notificationService: AdminNotificationService,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminDocumentsService.name);
    }
  }

  /**
   * 사업자 서류 목록 조회
   *
   * @param query 필터(status) + 페이지네이션
   */
  async findAll(query: DocumentListQueryDto) {
    const { page, limit, status } = query;
    const offset = (page - 1) * limit;

    const whereClause = status
      ? eq(businessDocuments.status, status)
      : undefined;

    // 전체 건수
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(businessDocuments)
      .where(whereClause);

    // 서류 목록 — 워커 프로필 + 유저 정보 JOIN
    const rows = await this.db
      .select({
        id: businessDocuments.id,
        businessNumber: businessDocuments.businessNumber,
        documentUrl: businessDocuments.documentUrl,
        status: businessDocuments.status,
        validationMessage: businessDocuments.validationMessage,
        submittedAt: businessDocuments.submittedAt,
        validatedAt: businessDocuments.validatedAt,
        workerProfileId: businessDocuments.workerProfileId,
        workerSlug: workerProfiles.slug,
        workerBusinessName: workerProfiles.businessName,
        workerUserId: workerProfiles.userId,
        workerUserEmail: users.email,
        workerUserRealName: users.realName,
      })
      .from(businessDocuments)
      .leftJoin(
        workerProfiles,
        eq(businessDocuments.workerProfileId, workerProfiles.id),
      )
      .leftJoin(users, eq(workerProfiles.userId, users.id))
      .where(whereClause)
      .orderBy(desc(businessDocuments.submittedAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  /**
   * PENDING 서류 건수 조회 (네비게이션 배지용)
   */
  async countPending(): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(businessDocuments)
      .where(eq(businessDocuments.status, 'PENDING'));
    return Number(total);
  }

  /**
   * 사업자 서류 승인
   *
   * 단일 트랜잭션:
   * 1. businessDocuments.status = APPROVED
   * 2. workerProfiles.businessVerified = true
   * 3. manualReviews 생성
   * 4. 감사 로그 기록
   * 5. SSE 알림 발행
   *
   * @param docId 서류 ID
   * @param adminId 처리 관리자 ID
   */
  async approve(docId: string, adminId: string) {
    const [doc] = await this.db
      .select()
      .from(businessDocuments)
      .where(eq(businessDocuments.id, docId))
      .limit(1);

    if (!doc) {
      throw new NotFoundException('해당 서류를 찾을 수 없습니다');
    }
    if (doc.status !== 'PENDING') {
      throw new ConflictException(
        `이미 처리된 서류입니다 (현재 상태: ${doc.status})`,
      );
    }

    await this.db.transaction(async (tx) => {
      const now = new Date();

      // 서류 상태 APPROVED 로 업데이트
      await tx
        .update(businessDocuments)
        .set({ status: 'APPROVED', validatedAt: now })
        .where(eq(businessDocuments.id, docId));

      // 워커 인증 뱃지 활성화
      await tx
        .update(workerProfiles)
        .set({ businessVerified: true, updatedAt: now })
        .where(eq(workerProfiles.id, doc.workerProfileId));

      // 검토 기록 생성
      await tx.insert(manualReviews).values({
        documentId: docId,
        adminId,
        decision: 'APPROVED',
        reason: null,
        reviewedAt: now,
      });
    });

    // 감사 로그 (트랜잭션 외부 — 실패해도 원본 작업 영향 없음)
    await this.auditService.log(
      adminId,
      'DOCUMENT_APPROVE',
      'business_document',
      docId,
      { status: 'PENDING' },
      { status: 'APPROVED' },
    );

    // SSE 알림 발행
    this.notificationService.emit('NEW_DOCUMENT', {
      action: 'APPROVED',
      docId,
      workerProfileId: doc.workerProfileId,
    });

    this.logger.info({ adminId, docId }, '사업자 서류 승인');
    return { id: docId, status: 'APPROVED' };
  }

  /**
   * 사업자 서류 거절
   *
   * 단일 트랜잭션:
   * 1. businessDocuments.status = REJECTED, validationMessage = reason
   * 2. manualReviews 생성
   * 3. 감사 로그 기록
   * 4. SSE 알림 발행
   *
   * @param docId 서류 ID
   * @param adminId 처리 관리자 ID
   * @param reason 거절 사유 (필수)
   */
  async reject(docId: string, adminId: string, reason: string) {
    const [doc] = await this.db
      .select()
      .from(businessDocuments)
      .where(eq(businessDocuments.id, docId))
      .limit(1);

    if (!doc) {
      throw new NotFoundException('해당 서류를 찾을 수 없습니다');
    }
    if (doc.status !== 'PENDING') {
      throw new ConflictException(
        `이미 처리된 서류입니다 (현재 상태: ${doc.status})`,
      );
    }

    await this.db.transaction(async (tx) => {
      const now = new Date();

      // 서류 상태 REJECTED로 업데이트
      await tx
        .update(businessDocuments)
        .set({
          status: 'REJECTED',
          validationMessage: reason,
          validatedAt: now,
        })
        .where(eq(businessDocuments.id, docId));

      // 검토 기록 생성
      await tx.insert(manualReviews).values({
        documentId: docId,
        adminId,
        decision: 'REJECTED',
        reason,
        reviewedAt: now,
      });
    });

    await this.auditService.log(
      adminId,
      'DOCUMENT_REJECT',
      'business_document',
      docId,
      { status: 'PENDING' },
      { status: 'REJECTED', reason },
    );

    this.notificationService.emit('NEW_DOCUMENT', {
      action: 'REJECTED',
      docId,
      workerProfileId: doc.workerProfileId,
    });

    this.logger.info({ adminId, docId, reason }, '사업자 서류 거절');
    return { id: docId, status: 'REJECTED' };
  }
}
