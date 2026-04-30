import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { workSchedules } from '@repo/database';
import { and, eq, lte, gte, ne } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { CreateWorkScheduleDto } from '../dtos/work-schedule.dto';
import { UpdateWorkScheduleDto } from '../dtos/work-schedule.dto';

/** 충돌 일정 요약 형태 */
export interface ConflictSummary {
  id: string;
  title: string | null;
  startDate: string;
  endDate: string;
}

/** POST/PATCH 응답 형태 */
export interface ScheduleWithConflicts {
  schedule: typeof workSchedules.$inferSelect;
  conflicts: ConflictSummary[];
}

@Injectable()
export class WorkScheduleService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 월별 작업 일정 조회
   *
   * 멀티월 일정 포함: start_date <= 월 마지막날 AND end_date >= 월 첫날
   *
   * @param workerProfileId 조회 대상 워커 프로필 ID
   * @param year 연도
   * @param month 월 (1-12)
   */
  async getSchedules(
    workerProfileId: string,
    year: number,
    month: number,
  ): Promise<(typeof workSchedules.$inferSelect)[]> {
    // 월의 첫날과 마지막날 계산 (date string: YYYY-MM-DD)
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayDate = new Date(year, month, 0); // month는 1-based, Date의 0일 = 전달 마지막날
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

    return this.db
      .select()
      .from(workSchedules)
      .where(
        and(
          eq(workSchedules.workerProfileId, workerProfileId),
          // 멀티월 일정 포함: 겹치는 일정 = start_date <= lastDay AND end_date >= firstDay
          lte(workSchedules.startDate, lastDay),
          gte(workSchedules.endDate, firstDay),
        ),
      );
  }

  /**
   * 작업 일정 등록
   *
   * 충돌 감지 후 일정 등록. 충돌 있어도 등록은 허용하고 conflicts 배열로 반환.
   *
   * @param workerProfileId 워커 프로필 ID
   * @param dto 생성 데이터
   * @returns 등록된 일정 + 충돌 목록
   */
  async createSchedule(
    workerProfileId: string,
    dto: CreateWorkScheduleDto,
  ): Promise<ScheduleWithConflicts> {
    // 충돌 감지
    const conflicts = await this.findConflicts(
      workerProfileId,
      dto.startDate,
      dto.endDate,
    );

    // 일정 등록
    const [schedule] = await this.db
      .insert(workSchedules)
      .values({
        workerProfileId,
        title: dto.title ?? null,
        siteAddress: dto.siteAddress,
        fieldCode: dto.fieldCode,
        startDate: dto.startDate,
        endDate: dto.endDate,
        memo: dto.memo ?? null,
      })
      .returning();

    return { schedule, conflicts };
  }

  /**
   * 작업 일정 수정
   *
   * 소유권 검증(DB 레벨): worker_profile_id = 현재 유저.
   * 자기 자신은 충돌 검사에서 제외(excludeId).
   *
   * @param id 수정할 일정 ID
   * @param workerProfileId 현재 로그인 워커 프로필 ID
   * @param dto 수정 데이터
   * @returns 수정된 일정 + 충돌 목록
   */
  async updateSchedule(
    id: string,
    workerProfileId: string,
    dto: UpdateWorkScheduleDto,
  ): Promise<ScheduleWithConflicts> {
    // 소유권 포함 기존 일정 조회
    const [existing] = await this.db
      .select()
      .from(workSchedules)
      .where(
        and(
          eq(workSchedules.id, id),
          eq(workSchedules.workerProfileId, workerProfileId),
        ),
      );

    if (!existing) {
      throw new NotFoundException('일정을 찾을 수 없거나 수정 권한이 없습니다');
    }

    // 수정 후 적용될 날짜 (변경 없으면 기존 날짜 유지)
    const effectiveStartDate = dto.startDate ?? existing.startDate;
    const effectiveEndDate = dto.endDate ?? existing.endDate;

    // 충돌 감지 (자기 자신 제외)
    const conflicts = await this.findConflicts(
      workerProfileId,
      effectiveStartDate,
      effectiveEndDate,
      id, // excludeId — 자기 자신 제외
    );

    // 수정 실행
    const [schedule] = await this.db
      .update(workSchedules)
      .set({
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.siteAddress !== undefined && { siteAddress: dto.siteAddress }),
        ...(dto.fieldCode !== undefined && { fieldCode: dto.fieldCode }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workSchedules.id, id),
          eq(workSchedules.workerProfileId, workerProfileId),
        ),
      )
      .returning();

    return { schedule, conflicts };
  }

  /**
   * 작업 일정 삭제
   *
   * 소유권 검증(DB 레벨): worker_profile_id = 현재 유저.
   * 존재하지 않거나 타인의 일정이면 NotFoundException.
   *
   * @param id 삭제할 일정 ID
   * @param workerProfileId 현재 로그인 워커 프로필 ID
   */
  async deleteSchedule(id: string, workerProfileId: string): Promise<void> {
    const [deleted] = await this.db
      .delete(workSchedules)
      .where(
        and(
          eq(workSchedules.id, id),
          eq(workSchedules.workerProfileId, workerProfileId),
        ),
      )
      .returning({ id: workSchedules.id });

    if (!deleted) {
      throw new NotFoundException('일정을 찾을 수 없거나 삭제 권한이 없습니다');
    }
  }

  /**
   * 날짜 범위 충돌 일정 조회
   *
   * 겹치는 조건: start_date <= newEnd AND end_date >= newStart
   *
   * @param workerProfileId 워커 프로필 ID
   * @param newStartDate 새 시작일
   * @param newEndDate 새 종료일
   * @param excludeId 수정 시 제외할 일정 ID (선택)
   */
  private async findConflicts(
    workerProfileId: string,
    newStartDate: string,
    newEndDate: string,
    excludeId?: string,
  ): Promise<ConflictSummary[]> {
    const conditions = [
      eq(workSchedules.workerProfileId, workerProfileId),
      lte(workSchedules.startDate, newEndDate),
      gte(workSchedules.endDate, newStartDate),
    ];

    if (excludeId) {
      conditions.push(ne(workSchedules.id, excludeId));
    }

    const rows = await this.db
      .select({
        id: workSchedules.id,
        title: workSchedules.title,
        startDate: workSchedules.startDate,
        endDate: workSchedules.endDate,
      })
      .from(workSchedules)
      .where(and(...conditions));

    return rows;
  }
}
