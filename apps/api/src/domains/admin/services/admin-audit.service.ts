import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { adminAuditLogs } from '@repo/database';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

export type AuditAction =
  | 'CODE_CREATE'
  | 'CODE_UPDATE'
  | 'CODE_DELETE'
  | 'USER_STATUS_CHANGE'
  | 'USER_ROLE_CHANGE';

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
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
      });
    } catch (err) {
      // 감사 로그 실패는 원본 작업을 막지 않음 — 경고만 기록
      this.logger.warn({ err, action, targetId }, '감사 로그 기록 실패');
    }
  }
}
