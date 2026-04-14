import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { workerProfiles, workerFields, workerAreas } from '@repo/database';
import {
  UpdateWorkerProfileBodyDto,
  UpdateWorkerProfileInfoDto,
} from '../dtos/update-profile.dto';
import { CompleteOnboardingDto } from '../dtos/complete-onboarding.dto';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(ProfileService.name);
    }
  }

  /**
   * 워커 프로필의 전문 분야 및 활동 지역 업데이트
   *
   * 다음 단계를 트랜잭션으로 처리:
   * 1. 워커 프로필 존재 여부 확인
   * 2. 기존 전문 분야(workerFields) 삭제
   * 3. 새로운 전문 분야 삽입
   * 4. 기존 활동 지역(workerAreas) 삭제
   * 5. 새로운 활동 지역 삽입
   *
   * @param workerProfileId 워커 프로필 ID
   * @param updateDto 업데이트 데이터 (fieldCodes, areaCodes)
   * @returns 업데이트된 전문 분야 및 활동 지역 정보
   * @throws BadRequestException - 워커 프로필 없음
   */
  async updateWorkerProfile(
    workerProfileId: string,
    updateDto: UpdateWorkerProfileBodyDto,
  ) {
    const { fieldCodes, areaCodes } = updateDto;

    this.logger.info(
      {
        workerProfileId,
        fieldCount: fieldCodes?.length ?? 0,
        areaCount: areaCodes?.length ?? 0,
      },
      '워커 프로필 업데이트 프로세스 시작',
    );

    // 트랜잭션으로 모든 작업을 원자적(atomic)으로 처리
    return await this.db.transaction(async (tx) => {
      try {
        // Step 1: 워커 프로필 존재 여부 확인
        this.logger.debug({ workerProfileId }, '워커 프로필 확인 중');
        const existingProfile = await tx
          .select()
          .from(workerProfiles)
          .where(eq(workerProfiles.id, workerProfileId))
          .limit(1);

        if (!existingProfile || existingProfile.length === 0) {
          this.logger.warn({ workerProfileId }, '워커 프로필을 찾을 수 없음');
          throw new BadRequestException('유효하지 않은 워커 프로필 ID입니다');
        }

        // Step 2 & 3: 전문 분야 업데이트 (기존 삭제 후 재삽입)
        if (fieldCodes !== undefined) {
          this.logger.debug(
            { workerProfileId, count: fieldCodes.length },
            '전문 분야 업데이트 중',
          );

          // 기존 전문 분야 삭제
          await tx
            .delete(workerFields)
            .where(eq(workerFields.workerProfileId, workerProfileId));

          // 새로운 전문 분야 삽입 (빈 배열이 아닌 경우만)
          if (fieldCodes.length > 0) {
            const fieldRecords = fieldCodes.map((fieldCode) => ({
              workerProfileId,
              fieldCode,
            }));

            await tx.insert(workerFields).values(fieldRecords);

            this.logger.info(
              { workerProfileId, count: fieldCodes.length },
              '전문 분야 업데이트 완료',
            );
          }
        }

        // Step 4 & 5: 활동 지역 업데이트 (기존 삭제 후 재삽입)
        if (areaCodes !== undefined) {
          this.logger.debug(
            { workerProfileId, count: areaCodes.length },
            '활동 지역 업데이트 중',
          );

          // 기존 활동 지역 삭제
          await tx
            .delete(workerAreas)
            .where(eq(workerAreas.workerProfileId, workerProfileId));

          // 새로운 활동 지역 삽입 (빈 배열이 아닌 경우만)
          if (areaCodes.length > 0) {
            const areaRecords = areaCodes.map((areaCode) => ({
              workerProfileId,
              areaCode,
            }));

            await tx.insert(workerAreas).values(areaRecords);

            this.logger.info(
              { workerProfileId, count: areaCodes.length },
              '활동 지역 업데이트 완료',
            );
          }
        }

        // 업데이트된 데이터 조회 및 반환
        const updatedFields = await tx
          .select()
          .from(workerFields)
          .where(eq(workerFields.workerProfileId, workerProfileId));

        const updatedAreas = await tx
          .select()
          .from(workerAreas)
          .where(eq(workerAreas.workerProfileId, workerProfileId));

        this.logger.info(
          { workerProfileId },
          '워커 프로필 업데이트 프로세스 완료',
        );

        return {
          workerProfileId,
          fields: updatedFields.map((f) => ({
            fieldCode: f.fieldCode,
          })),
          areas: updatedAreas.map((a) => ({
            areaCode: a.areaCode,
          })),
        };
      } catch (error) {
        // 에러 발생 시 Transaction이 자동으로 rollback됨
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          { error: errorMessage, stack: errorStack },
          '워커 프로필 업데이트 실패',
        );
        throw error;
      }
    });
  }

  /**
   * 워커 프로필의 전문 분야 조회
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 전문 분야 배열
   */
  async getWorkerFields(workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 전문 분야 조회 중');

    const fields = await this.db
      .select()
      .from(workerFields)
      .where(eq(workerFields.workerProfileId, workerProfileId));

    return fields.map((f) => ({
      fieldCode: f.fieldCode,
    }));
  }

  /**
   * 워커 프로필의 활동 지역 조회
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 활동 지역 배열
   */
  async getWorkerAreas(workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 활동 지역 조회 중');

    const areas = await this.db
      .select()
      .from(workerAreas)
      .where(eq(workerAreas.workerProfileId, workerProfileId));

    return areas.map((a) => ({
      areaCode: a.areaCode,
    }));
  }

  /**
   * 워커 프로필 핵심 정보 수정
   *
   * businessName, description, 사무실 주소 등 workerProfiles 테이블의
   * 핵심 필드를 부분 업데이트(PATCH)합니다.
   *
   * @param workerProfileId 워커 프로필 ID
   * @param updateDto 수정 데이터 (부분 업데이트 허용)
   * @returns 업데이트된 워커 프로필 정보
   * @throws NotFoundException - 워커 프로필 없음
   */
  async updateWorkerProfileInfo(
    workerProfileId: string,
    updateDto: UpdateWorkerProfileInfoDto,
  ) {
    this.logger.info({ workerProfileId }, '워커 프로필 핵심 정보 수정 시작');

    // 프로필 존재 여부 확인
    const existing = await this.db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.id, workerProfileId))
      .limit(1);

    if (!existing || existing.length === 0) {
      this.logger.warn({ workerProfileId }, '워커 프로필을 찾을 수 없음');
      throw new NotFoundException('워커 프로필을 찾을 수 없습니다');
    }

    // undefined 필드는 업데이트 대상에서 제외 (partial update)
    const updateValues: Record<string, unknown> = {};
    if (updateDto.businessName !== undefined)
      updateValues.businessName = updateDto.businessName;
    if (updateDto.profileImageUrl !== undefined)
      updateValues.profileImageUrl = updateDto.profileImageUrl;
    if (updateDto.description !== undefined)
      updateValues.description = updateDto.description;
    if (updateDto.careerSummary !== undefined)
      updateValues.careerSummary = updateDto.careerSummary;
    if (updateDto.yearsOfExperience !== undefined)
      updateValues.yearsOfExperience = updateDto.yearsOfExperience;
    if (updateDto.officeAddress !== undefined)
      updateValues.officeAddress = updateDto.officeAddress;
    if (updateDto.officeCity !== undefined)
      updateValues.officeCity = updateDto.officeCity;
    if (updateDto.officeDistrict !== undefined)
      updateValues.officeDistrict = updateDto.officeDistrict;
    if (updateDto.officePhoneNumber !== undefined)
      updateValues.officePhoneNumber = updateDto.officePhoneNumber;
    if (updateDto.operatingHours !== undefined)
      updateValues.operatingHours = updateDto.operatingHours;
    if (updateDto.officeImageUrl !== undefined)
      updateValues.officeImageUrl = updateDto.officeImageUrl;

    // updatedAt 갱신
    updateValues.updatedAt = new Date();

    const [updated] = await this.db
      .update(workerProfiles)
      .set(updateValues)
      .where(eq(workerProfiles.id, workerProfileId))
      .returning();

    this.logger.info({ workerProfileId }, '워커 프로필 핵심 정보 수정 완료');

    return updated;
  }

  /**
   * 현재 사용자의 워커 프로필 조회
   *
   * JWT 토큰에서 추출된 userId로 워커 프로필을 조회합니다.
   * 온보딩 완료 여부 확인에 사용됩니다.
   *
   * @param userId 사용자 ID (JWT에서 추출)
   * @returns 워커 프로필 (fields, areas 포함) 또는 null
   */
  async getMyWorkerProfile(userId: string) {
    this.logger.debug({ userId }, '내 워커 프로필 조회 중');

    const profiles = await this.db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, userId))
      .limit(1);

    if (!profiles || profiles.length === 0) {
      this.logger.debug({ userId }, '워커 프로필 없음');
      return null;
    }

    const profile = profiles[0];
    const fields = await this.getWorkerFields(profile.id);
    const areas = await this.getWorkerAreas(profile.id);

    return {
      ...profile,
      fields,
      areas,
    };
  }

  /**
   * 워커 온보딩 완료
   *
   * 워커 프로필 생성 또는 업데이트, 전문 분야 및 서비스 지역을 저장합니다.
   * 모든 DB 작업은 Drizzle 트랜잭션으로 처리됩니다.
   *
   * 프로세스:
   * 1. slug 중복 확인 (동일 사용자 slug는 허용)
   * 2. workerProfiles upsert (없으면 생성, 있으면 업데이트)
   * 3. workerFields 삭제 후 재삽입
   * 4. areaCodes 제공 시 workerAreas 삭제 후 재삽입
   *
   * @param userId 사용자 ID
   * @param dto 온보딩 완료 DTO
   * @returns 업데이트된 워커 프로필 정보
   * @throws ConflictException slug가 이미 다른 사용자에 의해 사용 중
   */
  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    const {
      slug,
      businessName,
      fieldCodes,
      yearsOfExperience,
      careerSummary,
      areaCodes,
    } = dto;

    this.logger.info({ userId, slug }, '온보딩 완료 프로세스 시작');

    return await this.db.transaction(async (tx) => {
      try {
        // slug가 제공된 경우에만 중복 확인 (동일 사용자의 기존 slug는 허용)
        if (slug !== undefined) {
          const slugConflict = await tx
            .select({ id: workerProfiles.id, userId: workerProfiles.userId })
            .from(workerProfiles)
            .where(eq(workerProfiles.slug, slug))
            .limit(1);

          if (slugConflict.length > 0 && slugConflict[0].userId !== userId) {
            this.logger.warn({ slug }, 'slug 중복 충돌');
            throw new ConflictException('이미 사용 중인 slug입니다');
          }
        }

        // 기존 프로필 조회 (upsert 처리)
        const existingProfile = await tx
          .select({ id: workerProfiles.id, slug: workerProfiles.slug })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, userId))
          .limit(1);

        let workerProfileId: string;

        if (existingProfile.length > 0) {
          // 기존 프로필 업데이트
          workerProfileId = existingProfile[0].id;
          this.logger.debug({ workerProfileId }, '기존 워커 프로필 업데이트');

          // slug가 없으면 기존 slug 유지 (4단계 온보딩 재호출 시 slug 덮어쓰기 방지)
          const updateValues: Record<string, unknown> = {
            businessName,
            updatedAt: new Date(),
          };
          if (slug !== undefined) updateValues.slug = slug;
          if (yearsOfExperience !== undefined)
            updateValues.yearsOfExperience = yearsOfExperience;
          if (careerSummary !== undefined)
            updateValues.careerSummary = careerSummary;

          await tx
            .update(workerProfiles)
            .set(updateValues)
            .where(eq(workerProfiles.id, workerProfileId));
        } else {
          // 신규 프로필 생성 — /onboarding/slug 페이지를 먼저 거쳐야 slug가 확정됨
          if (!slug) {
            throw new BadRequestException(
              'slug는 첫 온보딩 시 반드시 제공해야 합니다',
            );
          }

          this.logger.debug({ userId }, '신규 워커 프로필 생성');

          const [newProfile] = await tx
            .insert(workerProfiles)
            .values({
              userId,
              slug,
              businessName,
              yearsOfExperience: yearsOfExperience ?? undefined,
              careerSummary: careerSummary ?? undefined,
            })
            .returning();

          workerProfileId = newProfile.id;
        }

        // 전문 분야 업데이트: 기존 삭제 후 재삽입 (빈 배열이면 전체 삭제만)
        await tx
          .delete(workerFields)
          .where(eq(workerFields.workerProfileId, workerProfileId));

        if (fieldCodes.length > 0) {
          await tx.insert(workerFields).values(
            fieldCodes.map((fieldCode) => ({
              workerProfileId,
              fieldCode,
            })),
          );
        }

        this.logger.debug(
          { workerProfileId, count: fieldCodes.length },
          '전문 분야 업데이트 완료',
        );

        // 서비스 지역 업데이트: areaCodes가 제공된 경우 삭제 후 재삽입 (빈 배열이면 전체 삭제)
        if (areaCodes !== undefined) {
          await tx
            .delete(workerAreas)
            .where(eq(workerAreas.workerProfileId, workerProfileId));

          if (areaCodes.length > 0) {
            await tx.insert(workerAreas).values(
              areaCodes.map((areaCode) => ({
                workerProfileId,
                areaCode,
              })),
            );
          }

          this.logger.debug(
            { workerProfileId, count: areaCodes.length },
            '서비스 지역 업데이트 완료',
          );
        }

        // 업데이트된 프로필 조회 및 반환
        const updatedProfile = await tx
          .select()
          .from(workerProfiles)
          .where(eq(workerProfiles.id, workerProfileId))
          .limit(1);

        const updatedFields = await tx
          .select()
          .from(workerFields)
          .where(eq(workerFields.workerProfileId, workerProfileId));

        const updatedAreas = await tx
          .select()
          .from(workerAreas)
          .where(eq(workerAreas.workerProfileId, workerProfileId));

        this.logger.info({ userId, workerProfileId }, '온보딩 완료');

        return {
          ...updatedProfile[0],
          fields: updatedFields.map((f) => ({ fieldCode: f.fieldCode })),
          areas: updatedAreas.map((a) => ({ areaCode: a.areaCode })),
        };
      } catch (error) {
        // DB 유니크 제약 위반 (TOCTOU 경쟁 조건) → 409로 변환
        // pg 에러코드 23505: unique_violation (message 문자열 매칭보다 안정적)
        if ((error as any).code === '23505') {
          throw new ConflictException('이미 사용 중인 slug입니다');
        }
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error({ error: errorMessage }, '온보딩 완료 처리 실패');
        throw error;
      }
    });
  }

  /**
   * 워커 프로필의 전문 분야 및 활동 지역 함께 조회
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 워커 프로필 정보 (fields, areas 포함)
   */
  async getWorkerProfileInfo(workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 프로필 정보 조회 중');

    const profile = await this.db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.id, workerProfileId))
      .limit(1);

    if (!profile || profile.length === 0) {
      this.logger.warn({ workerProfileId }, '워커 프로필을 찾을 수 없음');
      return null;
    }

    const fields = await this.getWorkerFields(workerProfileId);
    const areas = await this.getWorkerAreas(workerProfileId);

    return {
      ...profile[0],
      fields,
      areas,
    };
  }
}
