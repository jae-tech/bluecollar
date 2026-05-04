import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 의뢰 생성 DTO
 *
 * 클라이언트가 워커에게 의뢰를 제출할 때 사용합니다.
 */
export const CreateInquirySchema = z.object({
  name: z
    .string()
    .min(1, '이름은 필수입니다')
    .max(100, '이름은 100자 이하여야 합니다')
    .trim(),

  phone: z
    .string()
    .min(1, '연락처는 필수입니다')
    .max(30, '연락처는 30자 이하여야 합니다')
    .trim(),

  location: z
    .string()
    .min(1, '시공 위치는 필수입니다')
    .max(200, '시공 위치는 200자 이하여야 합니다')
    .trim(),

  workType: z
    .string()
    .min(1, '시공 종류는 필수입니다')
    .max(100, '시공 종류는 100자 이하여야 합니다')
    .trim(),

  budget: z.string().max(100).trim().optional(),

  message: z.string().max(2000, '메시지는 2000자 이하여야 합니다').optional(),

  projectTitle: z
    .string()
    .max(200, '프로젝트명은 200자 이하여야 합니다')
    .optional(),
});

export class CreateInquiryDto extends createZodDto(CreateInquirySchema) {}

/**
 * 의뢰 상태 변경 DTO (워커용)
 *
 * 워커가 의뢰 상태를 변경할 때 사용합니다.
 */
export const UpdateInquiryStatusSchema = z.object({
  status: z.enum(['READ', 'REPLIED', 'ACCEPTED', 'DECLINED'], {
    error: '유효하지 않은 의뢰 상태입니다',
  }),
});

export class UpdateInquiryStatusDto extends createZodDto(
  UpdateInquiryStatusSchema,
) {}

/**
 * 클라이언트 의뢰 취소 DTO
 *
 * 클라이언트가 자신의 의뢰를 취소할 때 사용합니다.
 */
export const CancelInquirySchema = z.object({
  reason: z.string().max(200).optional(),
});

export class CancelInquiryDto extends createZodDto(CancelInquirySchema) {}

/**
 * 의뢰 목록 조회 쿼리 DTO
 */
export const GetInquiriesQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'READ', 'REPLIED', 'ACCEPTED', 'DECLINED', 'CANCELLED'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export class GetInquiriesQueryDto extends createZodDto(
  GetInquiriesQuerySchema,
) {}
