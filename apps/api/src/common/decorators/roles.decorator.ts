import { SetMetadata } from '@nestjs/common';

/**
 * @Roles() 데코레이터
 *
 * 메서드 또는 컨트롤러에 필요한 역할을 지정합니다.
 * RolesGuard와 함께 사용되어 권한 검증을 수행합니다.
 *
 * @example
 * @Post('/portfolios')
 * @Roles('WORKER', 'ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async createPortfolio() {
 *   // WORKER 또는 ADMIN만 접근 가능
 * }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
