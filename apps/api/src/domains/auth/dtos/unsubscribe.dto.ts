import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * 이메일 수신 거부 DTO
 *
 * @field email 수신 거부할 이메일 주소
 */
export const UnsubscribeSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .min(5)
    .max(255)
    .toLowerCase()
    .trim(),
});

export class UnsubscribeDto extends createZodDto(UnsubscribeSchema) {}
