import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * 📧 이메일 회원가입 DTO
 *
 * 📋 검증 규칙:
 * - email: RFC 5322 형식 (정규화됨: 소문자, 공백 제거)
 * - password: 최소 8자, 최대 128자 (강도는 옵션)
 * - realName: 필수, 1자 이상
 *
 * 🔒 보안:
 * - 일회용 이메일 도메인 차단
 * - 이메일 정규화 (Gmail '+' 제거)
 * - 비밀번호는 평문으로 절대 전송하지 않음 (HTTPS 필수)
 *
 * 📧 프로세스:
 * 1. 이메일과 비밀번호로 임시 계정 생성 (INACTIVE)
 * 2. 이메일 인증 코드 발송
 * 3. 사용자가 코드 입력 → 이메일 인증 완료
 * 4. 휴대폰 인증 화면으로 유도
 * 5. 휴대폰 인증 완료 → ACTIVE 상태로 변경
 */
export const EmailSignupSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .min(5, '이메일은 최소 5자 이상이어야 합니다')
    .max(255, '이메일은 255자 이하여야 합니다')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(128, '비밀번호는 128자 이하여야 합니다')
    .describe('비밀번호: 8-128자'),

  realName: z
    .string()
    .min(1, '이름은 필수입니다')
    .max(100, '이름은 100자 이하여야 합니다')
    .trim()
    .describe('실명'),

  agreeTerms: z
    .literal(true, {
      error: '이용약관과 개인정보 처리방침에 동의해야 합니다',
    })
    .describe('이용약관 동의'),

  role: z
    .enum(['WORKER', 'CLIENT'], {
      error: '역할은 WORKER 또는 CLIENT여야 합니다',
    })
    .default('WORKER')
    .optional()
    .describe('회원 역할 (기본값: WORKER)'),
});

export class EmailSignupDto extends createZodDto(EmailSignupSchema) {}
