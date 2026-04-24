import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { users, workerProfiles } from '@repo/database';
import { eq, ilike, or, and, count, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type { UserListQueryDto } from '../dtos/admin.dto';
import { AdminAuditService } from './admin-audit.service';

/**
 * 관리자 유저 관리 서비스
 *
 * 유저 목록 조회(검색/필터/페이지네이션), 상태 변경, 역할 변경을 담당합니다.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    private readonly auditService: AdminAuditService,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminUsersService.name);
    }
  }

  /**
   * 유저 목록 조회
   *
   * 이메일/이름 검색, 상태·역할 필터, 페이지네이션을 지원합니다.
   */
  async findAll(query: UserListQueryDto) {
    const { page, limit, search, status, role } = query;
    const offset = (page - 1) * limit;

    // 검색/필터 조건 구성
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.realName, `%${search}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(users.status, status));
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 전체 건수
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    // 페이지 데이터
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        realName: users.realName,
        role: users.role,
        status: users.status,
        provider: users.provider,
        emailVerified: users.emailVerified,
        termsAgreedAt: users.termsAgreedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
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
   * 유저 상태 변경
   *
   * @param adminId 작업 수행 관리자 ID (본인 계정 변경 방지에 사용)
   * @param targetUserId 변경 대상 유저 ID
   * @param newStatus 변경할 상태
   */
  async updateStatus(
    adminId: string,
    targetUserId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED',
  ) {
    // 본인 계정 보호
    if (adminId === targetUserId) {
      throw new BadRequestException('본인 계정의 상태는 변경할 수 없습니다');
    }

    const [target] = await this.db
      .select({ id: users.id, status: users.status, email: users.email })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다');
    }

    await this.db
      .update(users)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    // 감사 로그
    await this.auditService.log(
      adminId,
      'USER_STATUS_CHANGE',
      'user',
      targetUserId,
      { status: target.status },
      { status: newStatus },
    );

    this.logger.info(
      { adminId, targetUserId, from: target.status, to: newStatus },
      '유저 상태 변경',
    );

    return { id: targetUserId, status: newStatus };
  }

  /**
   * 유저 역할 변경
   *
   * @param adminId 작업 수행 관리자 ID
   * @param targetUserId 변경 대상 유저 ID
   * @param newRole 변경할 역할
   */
  async updateRole(
    adminId: string,
    targetUserId: string,
    newRole: 'ADMIN' | 'WORKER' | 'CLIENT',
  ) {
    if (adminId === targetUserId) {
      throw new BadRequestException('본인 계정의 역할은 변경할 수 없습니다');
    }

    const [target] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다');
    }

    await this.db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    await this.auditService.log(
      adminId,
      'USER_ROLE_CHANGE',
      'user',
      targetUserId,
      { role: target.role },
      { role: newRole },
    );

    this.logger.info(
      { adminId, targetUserId, from: target.role, to: newRole },
      '유저 역할 변경',
    );

    return { id: targetUserId, role: newRole };
  }
}
