import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import type { UserPayload } from '../types/user.types';

/**
 * 역할(Role) 기반 접근 제어 Guard
 *
 * @Roles() 데코레이터로 지정된 역할을 확인합니다.
 * 사용자의 역할(role)이 허용된 역할 목록에 포함되어 있으면 접근을 허용합니다.
 *
 * 사용 순서:
 * 1. JwtAuthGuard 먼저 인증 (토큰 검증)
 * 2. RolesGuard로 권한 검사 (역할 확인)
 *
 * @example
 * @Post('/portfolios')
 * @Roles('WORKER', 'ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async createPortfolio(@CurrentUser() user) {
 *   // WORKER 또는 ADMIN만 접근 가능
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 메서드 또는 클래스에서 @Roles() 메타데이터 가져오기
    const requiredRoles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() 데코레이터가 없으면 제한 없음
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 요청에서 사용자 정보 추출
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as UserPayload | undefined;

    // 사용자가 없으면 거부 (JwtAuthGuard에서 이미 검증했으므로 여기서는 나올 수 없음)
    if (!user) {
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다');
    }

    // 사용자의 역할이 허용된 역할 목록에 포함되어 있는지 확인
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
