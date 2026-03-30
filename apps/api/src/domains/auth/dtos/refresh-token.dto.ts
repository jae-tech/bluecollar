import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 토큰 갱신 요청 DTO
 *
 * 액세스 토큰이 만료된 경우 리프레시 토큰으로 새로운 액세스 토큰을 받습니다.
 *
 * @example
 * POST /auth/refresh
 * {
 *   "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
 * }
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .uuid({ message: '유효한 리프레시 토큰 형식이어야 합니다' }),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

/**
 * 토큰 갱신 응답 DTO
 */
export class RefreshTokenResponseDto {
  /**
   * 새로운 JWT 액세스 토큰 (15분 유효)
   */
  accessToken!: string;

  /**
   * 액세스 토큰 유효 시간 (초)
   */
  expiresIn!: number;

  /**
   * 토큰 타입
   */
  tokenType: string = 'Bearer';
}

/**
 * 로그아웃 요청 DTO
 */
export const LogoutSchema = z.object({
  refreshToken: z
    .string()
    .uuid({ message: '유효한 리프레시 토큰 형식이어야 합니다' }),
});

export class LogoutDto extends createZodDto(LogoutSchema) {}
