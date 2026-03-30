import { SetMetadata } from '@nestjs/common';

/**
 * @Public() 데코레이터
 *
 * 전역 JwtAuthGuard를 우회하고 공개 접근을 허용합니다.
 * 회원가입, 로그인, 공개 프로필 조회 등에 사용합니다.
 *
 * JwtAuthGuard에서 이 메타데이터를 확인하여 토큰 검증을 건너뜁니다.
 *
 * @example
 * @Post('/auth/register')
 * @Public()
 * async register() {
 *   // JWT 토큰 없이도 접근 가능
 * }
 *
 * @example
 * @Get('/public/profiles/:slug')
 * @Public()
 * async getPublicProfile() {
 *   // 누구나 접근 가능
 * }
 */
export const Public = () => SetMetadata('isPublic', true);
