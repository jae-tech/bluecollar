import { FastifyRequest } from 'fastify';
import type { UserPayload } from './user.types';

declare global {
  namespace FastifyInstance {
    interface FastifyRequest {
      /** JWT 토큰에서 추출한 현재 사용자 정보 */
      user?: UserPayload;
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    /** JWT 토큰에서 추출한 현재 사용자 정보 */
    user?: UserPayload;
  }
}
