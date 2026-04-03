import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { validateSlug } from '@/common/validators/slug.validator';

/**
 * 온보딩 완료 DTO
 *
 * 워커가 온보딩을 완료할 때 제출하는 데이터입니다.
 * workerProfiles, workerFields, workerAreas 테이블을 업데이트합니다.
 *
 * 필수:
 * - businessName: 사업명 또는 이름
 *
 * 선택:
 * - slug: 프로필 URL — /onboarding/slug 단계에서 먼저 설정, 이후 4단계 온보딩에서는 생략 가능
 * - fieldCodes: 전문 분야 코드 (빈 배열 허용 — slug 선행 설정 시)
 * - yearsOfExperience: 경력 연수
 * - careerSummary: 경력 요약
 * - areaCodes: 서비스 지역 코드
 */
export const CompleteOnboardingSchema = z.object({
  slug: z
    .string()
    .optional()
    .superRefine((v, ctx) => {
      if (v === undefined) return;
      const result = validateSlug(v);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error ?? '유효하지 않은 slug입니다',
        });
      }
    })
    .describe('프로필 URL slug (예: hong-gildong)'),

  businessName: z
    .string()
    .min(2, '사업명은 최소 2자 이상이어야 합니다')
    .max(100, '사업명은 최대 100자입니다')
    .describe('사업명 또는 이름'),

  fieldCodes: z
    .array(z.string())
    .min(0)
    .max(5, '전문 분야는 최대 5개까지 선택 가능합니다')
    .describe('전문 분야 코드 배열 (예: FLD_TILE) — 빈 배열 허용'),

  yearsOfExperience: z
    .number()
    .int()
    .min(0, '경력 연수는 0 이상이어야 합니다')
    .max(50, '경력 연수는 최대 50년입니다')
    .optional()
    .describe('경력 연수 (예: 1년=1, 3-5년=4, 10년+=10)'),

  careerSummary: z
    .string()
    .max(500, '경력 요약은 최대 500자입니다')
    .optional()
    .describe('경력 요약 (예: 15년 경력 타일 전문가)'),

  areaCodes: z
    .array(z.string())
    .max(5, '서비스 지역은 최대 5개까지 선택 가능합니다')
    .optional()
    .describe('서비스 지역 코드 배열 (예: AREA_SEOUL_GN)'),
});

export class CompleteOnboardingDto extends createZodDto(
  CompleteOnboardingSchema,
) {}
