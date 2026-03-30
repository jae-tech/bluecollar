import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

/**
 * JWT 인증 Guard (전역 보호)
 *
 * 모든 요청에 대해 JWT 토큰을 검증합니다.
 * 단, @Public() 데코레이터가 있는 라우트는 토큰 검증을 건너뜁니다.
 *
 * 전역 Guard로 등록되어 모든 엔드포인트를 기본적으로 보호합니다.
 * 공개 엔드포인트는 @Public() 데코레이터로 명시적으로 표시합니다.
 *
 * 토큰 검증 실패 시 401 Unauthorized 반환
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // 메서드 또는 클래스에 @Public() 메타데이터가 있는지 확인
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Public() 데코레이터가 있으면 토큰 검증 건너뜀
    if (isPublic) {
      return true;
    }

    // 나머지는 JWT 검증 수행
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // 에러가 있거나 사용자가 없으면 예외 발생
    if (err || !user) {
      const message = info?.message || err?.message || '인증이 필요합니다';

      throw new UnauthorizedException({
        statusCode: 401,
        message,
        error: 'Unauthorized',
      });
    }

    return user;
  }
}
