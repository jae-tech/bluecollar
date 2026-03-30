import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';
import type { UserPayload } from '../types/user.types';

/**
 * 소유권 검증 Guard
 *
 * 워커가 자신의 프로필과 포트폴리오만 수정할 수 있도록 검증합니다.
 *
 * 검증 방식:
 * 1. 라우트 파라미터에서 workerProfileId 추출
 * 2. JWT 토큰의 workerProfileId와 비교
 * 3. 일치하지 않으면 403 Forbidden 반환
 *
 * ADMIN은 모든 리소스 접근 가능 (override)
 *
 * @example
 * @Patch('/workers/profile/:workerProfileId')
 * @UseGuards(JwtAuthGuard, OwnershipGuard)
 * async updateProfile(
 *   @Param('workerProfileId') workerProfileId: string,
 *   @CurrentUser() user,
 * ) {
 *   // user.workerProfileId === workerProfileId 일 때만 실행됨
 * }
 *
 * @example
 * @Get('/portfolios/worker/:workerProfileId')
 * @UseGuards(JwtAuthGuard, OwnershipGuard)
 * async getWorkerPortfolios(
 *   @Param('workerProfileId') workerProfileId: string,
 * ) {
 *   // 자신의 포트폴리오만 조회 가능
 * }
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(OwnershipGuard.name);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as UserPayload | undefined;

    // 사용자가 없으면 거부 (JwtAuthGuard에서 이미 검증했으므로 여기서는 나올 수 없음)
    if (!user) {
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다');
    }

    // ADMIN은 모든 리소스에 접근 가능
    if (user.role === 'ADMIN') {
      this.logger.debug(
        { userId: user.id },
        'ADMIN 사용자 - 소유권 검증 건너뜸',
      );
      return true;
    }

    // WORKER만 소유권 검증 필요
    if (user.role !== 'WORKER') {
      // WORKER가 아닌데 OwnershipGuard를 사용한 경우
      // (예: CLIENT 역할 사용자가 리소스 수정 시도)
      this.logger.warn(
        { userId: user.id, role: user.role },
        'WORKER가 아닌 사용자가 소유권 검증이 필요한 라우트 접근 시도',
      );
      throw new ForbiddenException(
        '이 작업을 수행할 권한이 없습니다. WORKER 역할이 필요합니다.',
      );
    }

    // 라우트 파라미터에서 workerProfileId 추출
    // 지원되는 파라미터명: workerProfileId, id, profileId
    const params = request.params as Record<string, string>;
    const routeWorkerProfileId =
      params?.workerProfileId || params?.profileId || params?.id;

    if (!routeWorkerProfileId) {
      this.logger.error(
        { path: request.url },
        '라우트 파라미터에 workerProfileId를 찾을 수 없음',
      );
      throw new BadRequestException(
        '라우트 파라미터에 workerProfileId가 필요합니다',
      );
    }

    // 사용자의 workerProfileId와 비교
    if (!user.workerProfileId) {
      this.logger.warn(
        { userId: user.id },
        'JWT 토큰에 workerProfileId가 없음',
      );
      throw new ForbiddenException(
        '워커 프로필 정보가 없습니다. 회원가입을 완료해주세요.',
      );
    }

    if (user.workerProfileId !== routeWorkerProfileId) {
      this.logger.warn(
        {
          userId: user.id,
          userWorkerProfileId: user.workerProfileId,
          requestedWorkerProfileId: routeWorkerProfileId,
        },
        '소유권 검증 실패 - 다른 워커의 리소스 접근 시도',
      );
      throw new ForbiddenException(
        '자신의 프로필과 포트폴리오만 수정할 수 있습니다.',
      );
    }

    this.logger.debug(
      { userId: user.id, workerProfileId: user.workerProfileId },
      '소유권 검증 성공',
    );

    return true;
  }
}
