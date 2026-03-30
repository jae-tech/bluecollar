import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { users } from '@repo/database';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';
import type { UserPayload } from '../types/user.types';

/**
 * JWT 전략 (Passport Strategy)
 *
 * 요청의 Authorization 헤더에서 JWT 토큰을 추출하여 검증합니다.
 * Bearer <token> 형식에서 토큰을 읽고, JWT_SECRET으로 서명을 검증합니다.
 *
 * JWT 페이로드 구조:
 * {
 *   sub: userId,           // 표준 JWT claim (사용자 ID)
 *   email: string,         // 사용자 이메일
 *   role: 'WORKER' | 'ADMIN' | 'CLIENT',
 *   provider: 'local' | 'google' | 'kakao',  // 인증 제공자
 *   workerProfileId?: string,  // WORKER 역할만 포함
 *   iat: timestamp,        // 발급 시간
 *   exp: timestamp         // 만료 시간
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    });

    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(JwtStrategy.name);
    }
  }

  /**
   * JWT 토큰 검증 후 사용자 정보 반환
   *
   * Passport가 토큰을 자동으로 검증하고, 이 메서드에 페이로드를 전달합니다.
   * 반환된 객체는 request.user에 설정됩니다.
   *
   * 🔒 보안:
   * - 토큰에 저장된 사용자 ID로 DB 조회 (토큰 발급 후 삭제된 사용자 방지)
   * - INACTIVE 상태 사용자는 통과하지만 로그에 기록
   *
   * @param payload JWT 페이로드 (sub, email, role, provider, workerProfileId)
   * @returns UserPayload 사용자 객체 또는 null (검증 실패 시)
   */
  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    provider: string;
    workerProfileId?: string;
    iat: number;
    exp: number;
  }): Promise<UserPayload | null> {
    this.logger.debug(
      { userId: payload.sub, email: payload.email, provider: payload.provider },
      '✓ JWT 토큰 검증 중',
    );

    try {
      // 📧 DB에서 사용자 확인 (토큰 발급 후 삭제된 사용자 방지)
      const user = await this.db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          status: users.status,
          provider: users.provider,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
        })
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (user.length === 0) {
        this.logger.warn(
          { userId: payload.sub },
          '❌ 토큰에 해당하는 사용자를 찾을 수 없음 (삭제됨)',
        );
        return null;
      }

      const userRecord = user[0];

      // ⚠️ INACTIVE 사용자 경고 (로그인은 허용하나 로깅)
      if (userRecord.status === 'INACTIVE') {
        this.logger.warn(
          { userId: userRecord.id, email: userRecord.email },
          '⚠️ INACTIVE 상태 사용자 접근',
        );
      }

      // 📋 사용자 객체 반환 (request.user에 설정됨)
      const userPayload: UserPayload = {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role as 'ADMIN' | 'WORKER' | 'CLIENT',
        status: userRecord.status as
          | 'ACTIVE'
          | 'INACTIVE'
          | 'SUSPENDED'
          | 'DELETED',
        provider: userRecord.provider as 'local' | 'google' | 'kakao',
        emailVerified: userRecord.emailVerified,
        phoneVerified: userRecord.phoneVerified,
        ...(payload.workerProfileId && {
          workerProfileId: payload.workerProfileId,
        }),
      };
      return userPayload;
    } catch (error) {
      this.logger.error(
        { userId: payload.sub, error: (error as Error).message },
        '❌ JWT 검증 중 에러 발생',
      );
      return null;
    }
  }
}
