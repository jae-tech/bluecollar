import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { masterCodes } from '@repo/database';
import { eq, like, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

@Injectable()
export class CodesService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(CodesService.name);
    }
  }

  /**
   * 그룹별 마스터 코드 목록 조회
   *
   * @param group 코드 그룹 (예: FIELD, EXP, BIZ, AREA, SKILL_TAG_FLD_TILE)
   *              SKILL_TAG 접두사를 전달하면 해당 접두사로 시작하는 모든 그룹 반환
   * @returns 해당 그룹의 코드 목록 (sortOrder 오름차순)
   */
  async findByGroup(group: string) {
    // SKILL_TAG 그룹은 접두사 패턴으로 조회 (예: SKILL_TAG_FLD_TILE)
    const rows = await this.db
      .select()
      .from(masterCodes)
      .where(eq(masterCodes.group, group))
      .orderBy(asc(masterCodes.sortOrder));

    return rows;
  }

  /**
   * SKILL_TAG 그룹 전체 조회 (특정 접두사로 시작하는 그룹들)
   *
   * @param fieldCode 업종 코드 (예: FLD_TILE) — SKILL_TAG_FLD_TILE 그룹을 조회
   * @returns 해당 업종의 기술 태그 목록
   */
  async findSkillTagsByField(fieldCode: string) {
    const group = `SKILL_TAG_${fieldCode}`;
    return this.findByGroup(group);
  }

  /**
   * FIELD 코드 전체 목록 조회
   *
   * @returns 모든 업종 코드 목록
   */
  async findAllFields() {
    return this.findByGroup('FIELD');
  }

  /**
   * EXP 코드 전체 목록 조회
   *
   * @returns 모든 숙련도 코드 목록
   */
  async findAllExp() {
    return this.findByGroup('EXP');
  }

  /**
   * BIZ 코드 전체 목록 조회
   *
   * @returns 모든 사업자 유형 코드 목록
   */
  async findAllBiz() {
    return this.findByGroup('BIZ');
  }

  /**
   * AREA 코드 전체 목록 조회
   *
   * @returns 모든 지역 코드 목록
   */
  async findAllAreas() {
    return this.findByGroup('AREA');
  }

  /**
   * 모든 그룹의 코드를 한 번에 조회 (온보딩용)
   *
   * @returns FIELD, EXP, BIZ 코드 묶음
   */
  async findOnboardingCodes() {
    const [fields, expLevels, bizTypes] = await Promise.all([
      this.findAllFields(),
      this.findAllExp(),
      this.findAllBiz(),
    ]);

    return { fields, expLevels, bizTypes };
  }
}
