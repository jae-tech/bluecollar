import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isSlugReserved } from '@repo/database';

export const CreateWorkerSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: '휴대폰 번호는 최소 10자 이상이어야 합니다' })
    .max(20, { message: '휴대폰 번호는 최대 20자 이하여야 합니다' })
    .regex(/^\d{10,20}$/, { message: '휴대폰 번호는 숫자만 포함해야 합니다' }),
  businessName: z
    .string()
    .min(2, { message: '사업명은 최소 2자 이상이어야 합니다' })
    .max(100, { message: '사업명은 최대 100자 이하여야 합니다' }),
  slug: z
    .string()
    .min(3, { message: 'slug는 최소 3자 이상이어야 합니다' })
    .max(50, { message: 'slug는 최대 50자 이하여야 합니다' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'slug는 소문자, 숫자, 하이픈만 포함할 수 있습니다',
    })
    .refine((slug) => !isSlugReserved(slug), {
      message:
        'This slug is reserved and cannot be used. Please choose a different slug.',
    }),
  fieldCodes: z
    .array(z.string())
    .min(1, { message: '최소 1개 이상의 업종을 선택해야 합니다' })
    .max(5, { message: '최대 5개까지의 업종만 선택할 수 있습니다' }),
  areaCodes: z
    .array(z.string())
    .min(1, { message: '최소 1개 이상의 지역을 선택해야 합니다' })
    .max(5, { message: '최대 5개까지의 지역만 선택할 수 있습니다' }),
  realName: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: '실명은 최소 2자 이상이어야 합니다',
    }),
  email: z
    .string()
    .email({ message: '유효한 이메일 주소를 입력해주세요' })
    .optional()
    .or(z.literal('')),
});

export class CreateWorkerDto extends createZodDto(CreateWorkerSchema) {}
