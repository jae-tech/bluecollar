import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 📧 이메일 기반 로그인 DTO
 *
 * 🔒 보안:
 * - 비밀번호는 bcrypt로 검증 (평문 비교 X)
 * - INACTIVE 계정 로그인 차단 (403 Forbidden)
 * - 로그인 실패 시 일관된 메시지 ("이메일 또는 비밀번호가 일치하지 않습니다")
 * - Rate Limiting 적용 (동일 IP당 5회/분)
 *
 * 📧 로그인 프로세스:
 * 1. Local Strategy에서 email/password 검증
 * 2. bcrypt.compare()로 비밀번호 확인
 * 3. 계정 상태 확인 (INACTIVE 차단)
 * 4. JWT 토큰 발급
 */
export const EmailLoginSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, '비밀번호를 입력하세요')
    .describe('비밀번호'),
});

export class EmailLoginDto extends createZodDto(EmailLoginSchema) {}

/**
 * 📞 기존 휴대폰 기반 로그인 DTO (하위 호환성)
 *
 * 호출 흐름:
 * 1. POST /auth/send-verification-code → SMS 코드 발송
 * 2. POST /auth/verify-code → 사용자 입력 코드 검증
 * 3. POST /auth/login → 로그인 (토큰 발급)
 */
export const PhoneLoginSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: '휴대폰 번호는 최소 10자 이상이어야 합니다' })
    .max(20, { message: '휴대폰 번호는 최대 20자 이하여야 합니다' })
    .regex(/^\d{10,20}$/, { message: '휴대폰 번호는 숫자만 포함해야 합니다' }),
});

export class PhoneLoginDto extends createZodDto(PhoneLoginSchema) {}

/**
 * 호환성: 기존 LoginDto (deprecated)
 * @deprecated EmailLoginDto 사용 권장
 */
export class LoginDto extends EmailLoginDto {}

/**
 * ✅ 로그인 응답 DTO
 *
 * 로그인 성공 후 클라이언트에 반환되는 데이터
 */
export class LoginResponseDto {
  /**
   * JWT 액세스 토큰 (15분 유효)
   * Authorization 헤더에 "Bearer <accessToken>" 형식으로 사용
   */
  accessToken!: string;

  /**
   * 리프레시 토큰 (30일 유효, DB 저장)
   * POST /auth/refresh에서 새로운 accessToken을 받을 때 사용
   */
  refreshToken!: string;

  /**
   * 액세스 토큰 유효 시간 (초)
   * 15분 = 900초
   */
  expiresIn!: number;

  /**
   * 토큰 타입 (기본값: Bearer)
   */
  tokenType: string = 'Bearer';

  /**
   * 현재 로그인한 사용자 정보
   */
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'WORKER' | 'CLIENT';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    emailVerified: boolean;
    phoneVerified: boolean;
  };
}
