import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { users, workerProfiles } from '@repo/database';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';

/**
 * 로컬 전략 (이메일 + 비밀번호)
 *
 * Passport.js의 Local Strategy를 구현합니다.
 * POST /auth/login/email 에서 @UseGuards(AuthGuard('local'))로 호출됩니다.
 *
 * 검증 프로세스:
 * 1. 요청 바디에서 email, password 추출
 * 2. 이메일로 사용자 검색
 * 3. 비밀번호 검증 (bcrypt.compare)
 * 4. 사용자 객체 반환 → request.user에 설정 (INACTIVE 포함)
 *
 * 🔒 보안:
 * - 비밀번호는 bcrypt로 해시되어 DB에 저장
 * - INACTIVE 계정은 컨트롤러에서 emailVerified: false 기반으로 분기 처리
 * - 이메일이나 비밀번호 불일치 시 400 Bad Request
 *
 * 📧 이메일 기반:
 * - username 필드를 'email'로 설정하여 이메일 기반 인증
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    // 🔑 local 전략 설정: username 필드를 'email'로 변경
    super({
      usernameField: 'email',
      passwordField: 'password',
    });

    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(LocalStrategy.name);
    }
  }

  /**
   * 로컬 인증 검증
   *
   * Passport가 요청 바디에서 email, password를 추출하여
   * 이 메서드를 호출합니다.
   *
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호 (평문)
   * @returns 검증 성공 시 사용자 객체 (INACTIVE 포함), 실패 시 예외 발생
   * @throws BadRequestException 이메일 또는 비밀번호 불일치
   */
  async validate(email: string, password: string): Promise<any> {
    this.logger.debug({ email }, '🔐 로컬 인증 검증 중 (이메일 + 비밀번호)');

    try {
      // 📧 1️⃣ 이메일로 사용자 검색
      const user = await this.db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          role: users.role,
          status: users.status,
          provider: users.provider,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // ❌ 사용자 없음
      if (user.length === 0) {
        this.logger.warn({ email }, '❌ 이메일을 찾을 수 없음');
        throw new BadRequestException(
          '이메일 또는 비밀번호가 일치하지 않습니다',
        );
      }

      const userRecord = user[0];

      // 🔑 2️⃣ 비밀번호 검증 (bcrypt.compare)
      if (!userRecord.password) {
        // 소셜 로그인만 사용하는 계정 (로컬 비밀번호 없음)
        this.logger.warn(
          { email, provider: userRecord.provider },
          '❌ 로컬 비밀번호가 없는 계정 (소셜 로그인만 지원)',
        );
        throw new BadRequestException(
          '이 계정은 소셜 로그인으로만 접근 가능합니다',
        );
      }

      const passwordMatch = await bcrypt.compare(password, userRecord.password);
      if (!passwordMatch) {
        this.logger.warn({ email }, '❌ 비밀번호 불일치');
        throw new BadRequestException(
          '이메일 또는 비밀번호가 일치하지 않습니다',
        );
      }

      // ✅ 3️⃣ 검증 성공 - 사용자 객체 반환 (INACTIVE 포함)
      // INACTIVE 계정은 컨트롤러에서 emailVerified: false 여부를 확인하여 분기 처리
      this.logger.info({ email, userId: userRecord.id }, '✓ 로컬 인증 성공');

      // 4️⃣ WORKER인 경우 workerProfileId 조회 (JWT 페이로드에 포함 필요)
      let workerProfileId: string | undefined;
      if (userRecord.role === 'WORKER') {
        const profile = await this.db
          .select({ id: workerProfiles.id })
          .from(workerProfiles)
          .where(eq(workerProfiles.userId, userRecord.id))
          .limit(1);
        if (profile.length > 0) {
          workerProfileId = profile[0].id;
        }
      }

      return {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        status: userRecord.status,
        provider: userRecord.provider,
        emailVerified: userRecord.emailVerified,
        phoneVerified: userRecord.phoneVerified,
        workerProfileId,
      };
    } catch (error) {
      // 이미 throw된 예외는 그대로 propagate
      if (error instanceof BadRequestException) {
        throw error;
      }

      // 예상치 못한 에러
      this.logger.error(
        { email, error: (error as Error).message },
        '❌ 로컬 인증 중 에러 발생',
      );
      throw new BadRequestException('인증 처리 중 오류가 발생했습니다');
    }
  }
}
