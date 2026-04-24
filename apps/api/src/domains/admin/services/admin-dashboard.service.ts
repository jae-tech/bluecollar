import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { users, workerProfiles } from '@repo/database';
import { eq, count, gte, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

/**
 * 관리자 대시보드 서비스
 *
 * 운영 현황 집계 지표를 반환합니다.
 * - 전체/상태별 유저 수
 * - 전체 워커 프로필 수
 * - 최근 7일 신규 가입자 수
 * - 최근 가입자 목록 (5명)
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminDashboardService.name);
    }
  }

  async getSummary() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 병렬 집계 쿼리
    const [
      [{ total: totalUsers }],
      [{ total: activeUsers }],
      [{ total: suspendedUsers }],
      [{ total: workerCount }],
      [{ total: newUsersThisWeek }],
      recentSignups,
    ] = await Promise.all([
      // 전체 유저
      this.db.select({ total: count() }).from(users),

      // ACTIVE 유저
      this.db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, 'ACTIVE')),

      // SUSPENDED 유저
      this.db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, 'SUSPENDED')),

      // 워커 프로필 수 (온보딩 완료 기준)
      this.db.select({ total: count() }).from(workerProfiles),

      // 최근 7일 신규 가입
      this.db
        .select({ total: count() })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo)),

      // 최근 가입자 5명
      this.db
        .select({
          id: users.id,
          email: users.email,
          realName: users.realName,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(5),
    ]);

    return {
      users: {
        total: Number(totalUsers),
        active: Number(activeUsers),
        suspended: Number(suspendedUsers),
        newThisWeek: Number(newUsersThisWeek),
      },
      workers: {
        total: Number(workerCount),
      },
      recentSignups,
    };
  }
}
