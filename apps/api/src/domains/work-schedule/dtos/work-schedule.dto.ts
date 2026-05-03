import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 유효한 공정 코드 목록 — master_codes 테이블 FIELD 그룹과 동기화.
 *
 * ⚠️ seed.ts의 FIELD 그룹 변경 시 반드시 여기도 동기화할 것.
 * TODO: @repo/schema로 이전하여 프론트/백엔드 단일 진실 원천 보장.
 */
const VALID_FIELD_CODES = [
  'FLD_DEMOLITION',
  'FLD_WINDOW',
  'FLD_PLUMBING',
  'FLD_WATERPROOF',
  'FLD_ELECTRIC',
  'FLD_CARPENTRY',
  'FLD_FILM',
  'FLD_PAINTING',
  'FLD_TILE',
  'FLD_WALLPAPER',
  'FLD_FLOORING',
  'FLD_KITCHEN',
  'FLD_ELASTIC_COAT',
  'FLD_BATHROOM',
  'FLD_CLEANING',
  'FLD_GLAZING',
  'FLD_WELDING',
  'FLD_MACHINING',
  'FLD_PLASTER',
  'FLD_HVAC',
  'FLD_FURNITURE',
] as const;

/**
 * 작업 일정 생성 DTO
 *
 * end_date >= start_date 제약을 Zod refine으로 검증한다.
 */
export const CreateWorkScheduleSchema = z
  .object({
    title: z.string().max(100).optional(),
    siteAddress: z.string().min(1, '현장 주소는 필수입니다').max(200),
    fieldCode: z.enum(VALID_FIELD_CODES, {
      error: '유효하지 않은 공정 코드입니다',
    }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
    memo: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: '종료일은 시작일보다 같거나 이후여야 합니다',
    path: ['endDate'],
  });

export class CreateWorkScheduleDto extends createZodDto(
  CreateWorkScheduleSchema,
) {}

/**
 * 작업 일정 수정 DTO
 *
 * 모든 필드 선택적이나, 제공 시 동일한 검증 적용.
 * end_date와 start_date 모두 제공된 경우에만 순서 검증.
 */
export const UpdateWorkScheduleSchema = z
  .object({
    title: z.string().max(100).optional(),
    siteAddress: z.string().min(1).max(200).optional(),
    fieldCode: z
      .enum(VALID_FIELD_CODES, {
        error: '유효하지 않은 공정 코드입니다',
      })
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')
      .optional(),
    memo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: '종료일은 시작일보다 같거나 이후여야 합니다',
      path: ['endDate'],
    },
  );

export class UpdateWorkScheduleDto extends createZodDto(
  UpdateWorkScheduleSchema,
) {}

/**
 * 월별 일정 조회 쿼리 파라미터 DTO
 */
export const GetWorkSchedulesQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export class GetWorkSchedulesQueryDto extends createZodDto(
  GetWorkSchedulesQuerySchema,
) {}
