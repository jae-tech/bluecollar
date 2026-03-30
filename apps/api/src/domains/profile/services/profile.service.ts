import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { workerProfiles, workerFields, workerAreas } from '@repo/database';
import {
  UpdateWorkerProfileBodyDto,
  UpdateWorkerProfileInfoDto,
} from '../dtos/update-profile.dto';
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
