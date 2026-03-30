import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SMS 인증번호 발송 요청
 */
export const SendVerificationCodeSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: '휴대폰 번호는 최소 10자 이상이어야 합니다' })
    .max(20, { message: '휴대폰 번호는 최대 20자 이하여야 합니다' })
    .regex(/^\d{10,20}$/, { message: '휴대폰 번호는 숫자만 포함해야 합니다' }),
});

export class SendVerificationCodeDto extends createZodDto(
  SendVerificationCodeSchema,
) {}
