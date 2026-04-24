import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { masterCodes, workerFields, workerAreas } from '@repo/database';
import { eq, asc, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import type {
  CreateCodeDto,
  UpdateCodeDto,
  ReorderCodesDto,
} from '../dtos/admin.dto';
import { AdminAuditService } from './admin-audit.service';

/**
 * 관리자 코드 관리 서비스
 *
 * masterCodes 테이블의 CRUD 및 정렬 순서 변경을 담당합니다.
 * 수정 후 별도 캐시를 사용하지 않으므로 즉시 서비스에 반영됩니다.
 */
@Injectable()
export class AdminCodesService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
    private readonly auditService: AdminAuditService,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminCodesService.name);
    }
  }

  /**
   * 전체 코드 목록 조회 (그룹별 정렬)
   */
  async findAll(group?: string) {
    const query = this.db
      .select()
      .from(masterCodes)
      .orderBy(asc(masterCodes.group), asc(masterCodes.sortOrder));

    if (group) {
      return query.where(eq(masterCodes.group, group));
    }
    return query;
  }

  /**
   * 코드 생성
   */
  async create(adminId: string, dto: CreateCodeDto) {
    // 중복 코드 확인
    const [existing] = await this.db
      .select({ code: masterCodes.code })
      .from(masterCodes)
      .where(eq(masterCodes.code, dto.code))
      .limit(1);

    if (existing) {
      throw new ConflictException(`이미 존재하는 코드입니다: ${dto.code}`);
    }

    const [created] = await this.db
      .insert(masterCodes)
      .values({
        code: dto.code,
        group: dto.group,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    await this.auditService.log(
      adminId,
      'CODE_CREATE',
      'master_code',
      dto.code,
      null,
      created,
    );

    this.logger.info({ adminId, code: dto.code }, '코드 생성');
    return created;
  }

  /**
   * 코드 수정 (name, sortOrder만 변경 가능)
   */
  async update(adminId: string, code: string, dto: UpdateCodeDto) {
    const [existing] = await this.db
      .select()
      .from(masterCodes)
      .where(eq(masterCodes.code, code))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`코드를 찾을 수 없습니다: ${code}`);
    }

    const updateData: Partial<typeof existing> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const [updated] = await this.db
      .update(masterCodes)
      .set(updateData)
      .where(eq(masterCodes.code, code))
      .returning();

    await this.auditService.log(
      adminId,
      'CODE_UPDATE',
      'master_code',
      code,
      existing,
      updated,
    );

    this.logger.info({ adminId, code }, '코드 수정');
    return updated;
  }

  /**
   * 코드 삭제
   *
   * FK 참조(workerFields, workerAreas)가 있으면 삭제를 거부합니다.
   */
  async remove(adminId: string, code: string) {
    const [existing] = await this.db
      .select()
      .from(masterCodes)
      .where(eq(masterCodes.code, code))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`코드를 찾을 수 없습니다: ${code}`);
    }

    // FK 참조 확인 — workerFields
    const [{ refCount: fieldRefs }] = await this.db
      .select({ refCount: count() })
      .from(workerFields)
      .where(eq(workerFields.fieldCode, code));

    // FK 참조 확인 — workerAreas
    const [{ refCount: areaRefs }] = await this.db
      .select({ refCount: count() })
      .from(workerAreas)
      .where(eq(workerAreas.areaCode, code));

    const total = Number(fieldRefs) + Number(areaRefs);
    if (total > 0) {
      throw new ConflictException(
        `이 코드를 사용하는 데이터가 ${total}건 있어 삭제할 수 없습니다`,
      );
    }

    await this.db.delete(masterCodes).where(eq(masterCodes.code, code));

    await this.auditService.log(
      adminId,
      'CODE_DELETE',
      'master_code',
      code,
      existing,
      null,
    );

    this.logger.info({ adminId, code }, '코드 삭제');
    return { code };
  }

  /**
   * 코드 정렬 순서 일괄 변경 (드래그앤드롭 결과 반영)
   *
   * @param items code → sortOrder 매핑 배열
   */
  async reorder(adminId: string, dto: ReorderCodesDto) {
    // 각 코드의 sortOrder를 개별 업데이트 (트랜잭션)
    await this.db.transaction(async (tx) => {
      for (const item of dto.items) {
        await tx
          .update(masterCodes)
          .set({ sortOrder: item.sortOrder })
          .where(eq(masterCodes.code, item.code));
      }
    });

    await this.auditService.log(
      adminId,
      'CODE_UPDATE',
      'master_code',
      'REORDER',
      null,
      { items: dto.items },
    );

    this.logger.info({ adminId, count: dto.items.length }, '코드 정렬 변경');
    return { updated: dto.items.length };
  }
}
