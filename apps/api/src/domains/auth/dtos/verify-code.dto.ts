import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SMS 인증번호 검증 요청
 */
export const VerifyCodeSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: '휴대폰 번호는 최소 10자 이상이어야 합니다' })
    .max(20, { message: '휴대폰 번호는 최대 20자 이하여야 합니다' })
    .regex(/^\d{10,20}$/, { message: '휴대폰 번호는 숫자만 포함해야 합니다' }),
  code: z
    .string()
    .length(6, { message: '인증번호는 정확히 6자리여야 합니다' })
    .regex(/^\d{6}$/, { message: '인증번호는 숫자만 포함해야 합니다' }),
});

export class VerifyCodeDto extends createZodDto(VerifyCodeSchema) {}
