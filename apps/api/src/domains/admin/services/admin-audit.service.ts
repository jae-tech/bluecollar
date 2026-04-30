import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { adminAuditLogs, users } from '@repo/database';
import { eq, count, desc, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type { AuditLogQueryDto } from '../dtos/admin.dto';

export type AuditAction =
  | 'CODE_CREATE'
  | 'CODE_UPDATE'
  | 'CODE_DELETE'
  | 'USER_STATUS_CHANGE'
  | 'USER_ROLE_CHANGE'
  | 'DOCUMENT_APPROVE'
  | 'DOCUMENT_REJECT';

/** 감사 로그에 저장하기 전 민감한 필드를 마스킹합니다. */
function maskSensitive(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitive);

  const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
  ]);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key) ? '***' : maskSensitive(value);
  }
  return result;
}

/**
 * 관리자 감사 로그 서비스
 *
 * 코드값 변경, 유저 상태/역할 변경 이력을 admin_audit_logs 테이블에 기록합니다.
 */
@Injectable()
export class AdminAuditService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminAuditService.name);
    }
  }

  /**
   * 감사 로그 기록
   *
   * @param adminId 작업을 수행한 관리자 ID
   * @param action 작업 유형
   * @param targetType 대상 리소스 유형 (master_code, user)
   * @param targetId 대상 리소스 ID
   * @param before 변경 전 데이터
   * @param after 변경 후 데이터
   */
  async log(
    adminId: string,
    action: AuditAction,
    targetType: string,
    targetId: string,
    before?: unknown,
    after?: unknown,
  ): Promise<void> {
    try {
      await this.db.insert(adminAuditLogs).values({
        adminId,
        action,
        targetType,
        targetId,
        before: before ? JSON.stringify(maskSensitive(before)) : null,
        after: after ? JSON.stringify(maskSensitive(after)) : null,
      });
    } catch (err) {
      // 감사 로그 실패는 원본 작업을 막지 않음 — 경고만 기록
      this.logger.warn({ err, action, targetId }, '감사 로그 기록 실패');
    }
  }

  /**
   * 감사 로그 목록 조회
   *
   * action / adminId 필터, 최신순 페이지네이션을 지원합니다.
   * adminId는 users 테이블을 LEFT JOIN해 이메일을 함께 반환합니다.
   *
   * @param query 필터 + 페이지네이션
   */
  async findAll(query: AuditLogQueryDto) {
    const { page, limit, action, adminId } = query;
    const offset = (page - 1) * limit;

    // 조건 구성
    const conditions = [];
    if (action) conditions.push(eq(adminAuditLogs.action, action));
    if (adminId) conditions.push(eq(adminAuditLogs.adminId, adminId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 전체 건수
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(adminAuditLogs)
      .where(whereClause);

    // 로그 목록 — 관리자 이메일 LEFT JOIN
    const rows = await this.db
      .select({
        id: adminAuditLogs.id,
        adminId: adminAuditLogs.adminId,
        adminEmail: users.email,
        action: adminAuditLogs.action,
        targetType: adminAuditLogs.targetType,
        targetId: adminAuditLogs.targetId,
        before: adminAuditLogs.before,
        after: adminAuditLogs.after,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
      .where(whereClause)
      .orderBy(desc(adminAuditLogs.createdAt))
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
}
