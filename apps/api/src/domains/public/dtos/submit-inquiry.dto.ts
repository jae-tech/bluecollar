import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 워커 의뢰 접수 요청 DTO
 *
 * 고객이 워커 프로필 페이지에서 의뢰를 보낼 때 사용합니다.
 * 이름, 연락처, 위치, 공종은 필수 항목입니다.
 */
export const SubmitInquirySchema = z.object({
  /** 의뢰인 이름 */
  name: z.string().min(1, '이름을 입력해 주세요').max(50),

  /** 연락처 — 숫자·하이픈·공백 허용 (010-1234-5678 등) */
  phone: z
    .string()
    .min(1, '연락처를 입력해 주세요')
    .max(20)
    .regex(/^[0-9\-\s]+$/, '올바른 연락처 형식이 아닙니다'),

  /** 시공 위치 */
  location: z.string().min(1, '위치를 입력해 주세요').max(200),

  /** 공종 */
  workType: z.string().min(1, '공종을 입력해 주세요').max(100),

  /** 예산 (선택) */
  budget: z.string().max(100).optional(),

  /** 추가 메시지 (선택) */
  message: z.string().max(1000).optional(),

  /** 프로젝트명 (선택) */
  projectTitle: z.string().max(200).optional(),
});

export class SubmitInquiryDto extends createZodDto(SubmitInquirySchema) {}
