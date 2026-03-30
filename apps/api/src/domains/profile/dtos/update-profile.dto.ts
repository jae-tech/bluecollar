import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 워커 프로필 업데이트 요청 DTO
 *
 * 워커의 전문 분야(fields)와 활동 지역(areas)을 업데이트합니다.
 * - 기존 데이터는 먼저 삭제되고 새로운 데이터로 다시 생성됩니다 (트랜잭션)
 * - 둘 다 선택사항이지만, 적어도 하나는 제공되어야 합니다.
 */
export const UpdateWorkerProfileSchema = z
  .object({
    // 워커 프로필 ID (경로 파라미터에서 가져옴)
    workerProfileId: z
      .string()
      .uuid({ message: 'Invalid worker profile ID' })
      .describe('워커 프로필 ID (UUID)'),

    // 전문 분야 (선택사항)
    fieldCodes: z
      .array(z.string().min(1).max(50))
      .min(0)
      .optional()
      .describe('전문 분야 코드 배열 (예: FLD_TILE, FLD_PAINTING)'),

    // 활동 지역 (선택사항)
    areaCodes: z
      .array(z.string().min(1).max(50))
      .min(0)
      .optional()
      .describe('활동 지역 코드 배열 (예: AREA_SEOUL_GN, AREA_SEOUL_SC)'),
  })
  .refine(
    (data) =>
      (data.fieldCodes && data.fieldCodes.length > 0) ||
      (data.areaCodes && data.areaCodes.length > 0),
    {
      message: '전문 분야 또는 활동 지역 중 적어도 하나는 제공되어야 합니다',
      path: ['fieldCodes'],
    },
  );

export class UpdateWorkerProfileDto extends createZodDto(
  UpdateWorkerProfileSchema,
) {}

/**
 * 간단한 업데이트 요청용 DTO (경로 파라미터 제외)
 */
export const UpdateWorkerProfileBodySchema = z
  .object({
    fieldCodes: z
      .array(z.string().min(1).max(50))
      .min(0)
      .optional()
      .describe('전문 분야 코드 배열'),

    areaCodes: z
      .array(z.string().min(1).max(50))
      .min(0)
      .optional()
      .describe('활동 지역 코드 배열'),
  })
  .refine(
    (data) =>
      (data.fieldCodes && data.fieldCodes.length > 0) ||
      (data.areaCodes && data.areaCodes.length > 0),
    {
      message: '전문 분야 또는 활동 지역 중 적어도 하나는 제공되어야 합니다',
    },
  );

export class UpdateWorkerProfileBodyDto extends createZodDto(
  UpdateWorkerProfileBodySchema,
) {}

/**
 * 워커 프로필 핵심 정보 수정 DTO
 *
 * businessName, description, 사무실 정보 등 workerProfiles 테이블의
 * 핵심 필드를 업데이트합니다. 모든 필드는 선택사항(partial update).
 */
export const UpdateWorkerProfileInfoSchema = z
  .object({
    // 기본 정보
    businessName: z
      .string()
      .min(2, '사업명은 최소 2자 이상이어야 합니다')
      .max(100, '사업명은 최대 100자입니다')
      .optional()
      .describe('사업명'),

    profileImageUrl: z
      .string()
      .url('유효한 URL을 입력하세요')
      .optional()
      .describe('프로필 이미지 URL'),

    description: z
      .string()
      .max(1000, '자기소개는 최대 1000자입니다')
      .optional()
      .describe('자기소개'),

    // 경력 정보
    careerSummary: z
      .string()
      .max(200, '경력 요약은 최대 200자입니다')
      .optional()
      .describe('경력 요약 (예: 15년 경력 타일 전문가)'),

    yearsOfExperience: z
      .number()
      .int()
      .min(0)
      .max(60)
      .optional()
      .describe('경력 연수'),

    // 사무실 정보
    officeAddress: z.string().max(200).optional().describe('사무실 주소'),

    officeCity: z.string().max(50).optional().describe('도시'),

    officeDistrict: z.string().max(50).optional().describe('구'),

    officePhoneNumber: z.string().max(20).optional().describe('사무실 연락처'),

    operatingHours: z
      .string()
      .max(200)
      .optional()
      .describe('영업시간 (예: 월-금 09:00-18:00)'),

    officeImageUrl: z
      .string()
      .url('유효한 URL을 입력하세요')
      .optional()
      .describe('사무실 이미지 URL'),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: '적어도 하나의 필드를 제공해야 합니다',
  });

export class UpdateWorkerProfileInfoDto extends createZodDto(
  UpdateWorkerProfileInfoSchema,
) {}
