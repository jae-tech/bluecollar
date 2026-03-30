import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * 📧 이메일 인증 코드 검증 DTO
 *
 * 📋 검증 규칙:
 * - email: 유효한 이메일 형식
 * - code: UUID 형식 (36자) 또는 6자리 숫자 코드
 * - type: SIGNUP | PASSWORD_RESET | EMAIL_CHANGE
 *
 * 🔒 보안:
 * - 토큰 재사용 방지 (isUsed 플래그)
 * - 24시간 만료 확인
 * - 잘못된 코드에 대한 Rate Limiting 적용
 *
 * 📧 프로세스:
 * 1. 사용자가 이메일에서 수신한 6자리 코드 입력
 * 2. 또는 긴 UUID 토큰 직접 링크 클릭
 * 3. emailVerificationCodes 테이블에서 검증
 * 4. 성공 시 emailVerified = true로 업데이트
 */
export const EmailVerificationSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .toLowerCase()
    .trim(),

  code: z
    .string()
    .min(6, '인증 코드는 최소 6자 이상이어야 합니다')
    .max(64, '인증 코드는 64자 이하여야 합니다')
    .describe('인증번호 (6자리 또는 UUID)'),

  type: z
    .enum(['SIGNUP', 'PASSWORD_RESET', 'EMAIL_CHANGE'])
    .describe('인증 타입'),
});

export class EmailVerificationDto extends createZodDto(
  EmailVerificationSchema,
) {}

/**
 * 📧 이메일 인증 코드 재발송 DTO
 *
 * 사용자가 코드를 받지 못했거나 만료된 경우 재발송 요청
 *
 * ⏱️ Rate Limiting:
 * - 동일 이메일당 1분에 1회 제한
 * - 24시간에 최대 5회 제한
 */
export const EmailVerificationResendSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .toLowerCase()
    .trim(),

  type: z
    .enum(['SIGNUP', 'PASSWORD_RESET', 'EMAIL_CHANGE'])
    .default('SIGNUP')
    .describe('인증 타입'),
});

export class EmailVerificationResendDto extends createZodDto(
  EmailVerificationResendSchema,
) {}
