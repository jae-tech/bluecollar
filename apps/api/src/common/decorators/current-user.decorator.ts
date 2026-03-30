import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { UserPayload } from '../types/user.types';

/**
 * @CurrentUser() 데코레이터
 *
 * JWT 토큰에서 추출한 현재 사용자 정보를 메서드 파라미터에 주입합니다.
 *
 * @example
 * @Get('/profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: UserPayload) {
 *   console.log(user.id);              // 사용자 ID
 *   console.log(user.email);           // 이메일
 *   console.log(user.role);            // 역할 (WORKER, ADMIN, CLIENT)
 *   console.log(user.workerProfileId); // 워커 프로필 ID (WORKER만 있음)
 * }
 *
 * @example
 * @Get('/my-id')
 * async getMyId(@CurrentUser('id') userId: string) {
 *   return { id: userId };
 * }
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof UserPayload | undefined,
    ctx: ExecutionContext,
  ): UserPayload | UserPayload[keyof UserPayload] | undefined => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as UserPayload | undefined;

    if (!user) {
      return undefined;
    }

    // data가 지정되면 특정 필드만 반환
    // @CurrentUser('id') → user.id 반환
    if (data) {
      return user[data];
    }

    // data 없으면 전체 user 객체 반환
    return user;
  },
);
