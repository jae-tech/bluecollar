import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { refreshTokens, users, workerProfiles } from '@repo/database';
import { eq, and, lt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * 토큰 서비스
 *
 * JWT 토큰의 생성, 검증, 갱신, 폐기를 관리합니다.
 *
 * 토큰 전략:
 * - 액세스 토큰: 15분 유효 (보안)
 * - 리프레시 토큰: 30일 유효, DB 저장 (폐기 지원)
 */
@Injectable()
export class TokenService {
  private readonly accessTokenExpiry = '15m'; // 15분
  private readonly refreshTokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30일 (ms)

  constructor(
    private jwtService: JwtService,
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(TokenService.name);
    }
  }

  /**
   * 액세스 토큰과 리프레시 토큰 생성
   *
   * 📧 Email-based authentication:
   * - JWT 페이로드에 이메일과 provider 포함
   * - 토큰 보안 강화 (개인 식별 정보 포함)
   *
   * @param userId 사용자 ID
   * @param email 사용자 이메일
   * @param role 사용자 역할 (WORKER, ADMIN, CLIENT)
   * @param provider 인증 제공자 (local, google, kakao)
   * @param workerProfileId 워커 프로필 ID (WORKER만 포함)
   * @returns { accessToken, refreshToken, expiresIn }
   */
  async generateTokens(
    userId: string,
    email: string,
    role: string,
    provider: string = 'local',
    workerProfileId?: string,
  ) {
    this.logger.debug({ userId, email, role, provider }, '🔐 토큰 생성 시작');

    try {
      // 📋 JWT 페이로드
      // sub: 표준 JWT subject (사용자 ID)
      // email: 사용자 이메일 (식별용)
      // role: 역할 기반 접근 제어
      // provider: 인증 방식 추적
      const payload = {
        sub: userId,
        email,
        role,
        provider,
        ...(workerProfileId && { workerProfileId }), // WORKER만 포함
      };

      // 🔑 액세스 토큰 생성 (15분)
      // 짧은 유효시간 → 보안 강화
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.accessTokenExpiry,
      });

      // 🔄 리프레시 토큰 생성 (30일)
      // UUID 형식 → DB에 저장 가능 (token rotation, revocation 지원)
      const refreshTokenValue = uuidv4(); // 고유한 토큰 값
      const expiresAt = new Date(Date.now() + this.refreshTokenExpiry);

      // 💾 DB에 리프레시 토큰 저장
      // - 토큰 폐기 추적 (revokedAt)
      // - 만료 시간 관리
      await this.db.insert(refreshTokens).values({
        userId,
        token: refreshTokenValue,
        expiresAt,
      });

      this.logger.info(
        { userId, email, role, workerProfileId },
        '✓ 토큰 생성 완료',
      );

      return {
        accessToken,
        refreshToken: refreshTokenValue,
        expiresIn: 900, // 15분 = 900초
      };
    } catch (error) {
      this.logger.error(
        { userId, email, error: (error as Error).message },
        '❌ 토큰 생성 실패',
      );
      throw error;
    }
  }

  /**
   * 리프레시 토큰으로 새로운 액세스 토큰 발급
   *
   * 🔄 갱신 프로세스:
   * 1. 리프레시 토큰의 유효성 확인 (존재, 만료, 폐기)
   * 2. 토큰에 연결된 사용자 조회
   * 3. 새로운 액세스 토큰 생성 (이전 페이로드 재사용)
   *
   * @param refreshToken DB에 저장된 리프레시 토큰
   * @returns 새로운 accessToken
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.logger.debug(
      { refreshTokenPrefix: refreshToken.substring(0, 8) },
      '🔄 액세스 토큰 갱신 시작',
    );

    try {
      // 1️⃣ DB에서 리프레시 토큰 확인
      const tokenRecord = await this.db
        .select({
          userId: refreshTokens.userId,
          expiresAt: refreshTokens.expiresAt,
          revokedAt: refreshTokens.revokedAt,
        })
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken))
        .limit(1);

      if (tokenRecord.length === 0) {
        this.logger.warn({}, '❌ 토큰을 찾을 수 없음');
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      }

      const token = tokenRecord[0];

      // 2️⃣ 토큰 만료 여부 확인
      if (new Date() > token.expiresAt) {
        this.logger.warn({ userId: token.userId }, '❌ 리프레시 토큰 만료됨');
        throw new UnauthorizedException('리프레시 토큰이 만료되었습니다');
      }

      // 3️⃣ 토큰 폐기 여부 확인
      if (token.revokedAt) {
        this.logger.warn(
          { userId: token.userId },
          '❌ 로그아웃된 리프레시 토큰 사용 시도',
        );
        throw new UnauthorizedException('로그아웃된 토큰입니다');
      }

      // 4️⃣ 📧 사용자 정보 조회 (email 기반)
      const user = await this.db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          provider: users.provider,
        })
        .from(users)
        .where(eq(users.id, token.userId))
        .limit(1);

      if (user.length === 0) {
        this.logger.warn({ userId: token.userId }, '❌ 사용자를 찾을 수 없음');
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 5️⃣ 워커 프로필 ID 조회 (WORKER인 경우만)
      let workerProfileId: string | undefined;
      if (user[0].role === 'WORKER') {
        const profile = await this.db
          .select({ id: workerProfiles.id })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, user[0].id))
          .limit(1);

        if (profile.length > 0) {
          workerProfileId = profile[0].id;
        }
      }

      // 6️⃣ 새로운 액세스 토큰 생성 (email + provider 기반)
      const payload = {
        sub: user[0].id,
        email: user[0].email,
        role: user[0].role,
        provider: user[0].provider,
        ...(workerProfileId && { workerProfileId }),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.accessTokenExpiry,
      });

      this.logger.info(
        { userId: user[0].id, email: user[0].email },
        '✓ 액세스 토큰 갱신 완료',
      );

      return accessToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        { error: (error as Error).message },
        '❌ 액세스 토큰 갱신 중 에러',
      );
      throw new UnauthorizedException('토큰 갱신에 실패했습니다');
    }
  }

  /**
   * 로그아웃: 리프레시 토큰 폐기
   *
   * DB에서 리프레시 토큰을 무효화하여 더 이상 사용할 수 없도록 합니다.
   *
   * @param refreshToken 폐기할 리프레시 토큰
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    this.logger.debug(
      { refreshTokenPrefix: refreshToken.substring(0, 8) },
      '리프레시 토큰 폐기 시작',
    );

    try {
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, refreshToken));

      this.logger.info({}, '리프레시 토큰 폐기 완료');
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '리프레시 토큰 폐기 실패',
      );
      throw error;
    }
  }

  /**
   * 사용자의 모든 리프레시 토큰 폐기
   *
   * 다른 기기에서의 세션을 모두 종료합니다 (선택사항).
   *
   * @param userId 사용자 ID
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    this.logger.debug({ userId }, '모든 리프레시 토큰 폐기 시작');

    try {
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.userId, userId));

      this.logger.info({ userId }, '모든 리프레시 토큰 폐기 완료');
    } catch (error) {
      this.logger.error(
        { userId, error: (error as Error).message },
        '모든 리프레시 토큰 폐기 실패',
      );
      throw error;
    }
  }

  /**
   * 만료된 리프레시 토큰 정리 (Cleanup Job용)
   *
   * 크론 작업에서 주기적으로 호출하여 만료된 토큰을 정리합니다.
   *
   * @returns 삭제된 토큰 개수
   */
  async cleanupExpiredTokens(): Promise<number> {
    this.logger.debug({}, '만료된 토큰 정리 시작');

    try {
      // 만료 시간이 현재보다 이전인 토큰 삭제
      const deleted = await this.db
        .delete(refreshTokens)
        .where(lt(refreshTokens.expiresAt, new Date()))
        .returning({ id: refreshTokens.id });

      this.logger.info({ count: deleted.length }, '만료된 토큰 정리 완료');

      return deleted.length;
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '만료된 토큰 정리 중 에러',
      );
      return 0;
    }
  }
}
