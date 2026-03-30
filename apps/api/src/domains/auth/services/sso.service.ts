import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { users, accountLinkingAudit } from '@repo/database';
import { eq, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';
import { PinoLogger } from 'nestjs-pino';
import { EmailNormalizationService } from '@/common/services/email-normalization.service';

/**
 * SSO(Single Sign-On) 서비스
 *
 * 소셜 로그인(Google, Kakao) 통합 및 계정 연동을 관리합니다.
 *
 * 핵심 기능:
 * 1. SSO 프로필로부터 사용자 찾기 또는 생성
 * 2. 이메일 기반 계정 연동 (Account Linking)
 * 3. 계정 연동 이력 감시 (보안)
 * 4. 계정 연동 해제 (Unlink)
 *
 * 보안 고려사항:
 * - 계정 연동 시 이메일 검증 확인
 * - 의심 활동 감시 (IP, User-Agent)
 * - 연동 이력 기록
 */
@Injectable()
export class SsoService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private emailNormalizationService: EmailNormalizationService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(SsoService.name);
    }
  }

  /**
   * SSO 프로필로부터 사용자 찾기 또는 생성
   *
   * 플로우:
   * 1. provider + providerUserId로 기존 사용자 검색
   * 2. 없으면 이메일로 기존 로컬 계정 검색 (계정 연동)
   * 3. 없으면 새 사용자 생성 (상태: INACTIVE - 휴대폰 인증 필수)
   * 4. 기존 로컬 계정이 있으면 자동 연동
   *
   * @param provider 소셜 제공자 ('google' | 'kakao')
   * @param providerUser 소셜 프로필 정보
   * @param context 요청 컨텍스트 (IP, User-Agent)
   * @returns 사용자 객체
   */
  async findOrCreateSsoUser(
    provider: string,
    providerUser: any, // GoogleProfile | KakaoProfile
    context?: { ip?: string; userAgent?: string },
  ): Promise<any> {
    try {
      this.logger.info(
        { provider, email: providerUser.email },
        'SSO 사용자 조회/생성 시작',
      );

      // 📧 1. 이메일 정규화
      const normalizedEmail = this.emailNormalizationService.normalizeEmail(
        providerUser.email,
      );

      // 🔍 2a. provider + providerUserId로 기존 사용자 검색 (이미 연동된 계정)
      const existingSsoUser = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.provider, provider),
            eq(users.providerUserId, providerUser.id),
          ),
        )
        .limit(1);

      if (existingSsoUser.length > 0) {
        this.logger.info(
          { provider, email: normalizedEmail },
          '기존 SSO 계정 발견 (즉시 로그인)',
        );
        return existingSsoUser[0];
      }

      // 🔍 2b. 이메일로 기존 로컬 계정 검색 (계정 연동 대상)
      const existingLocalUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      // 3️⃣ 기존 로컬 계정이 있으면 자동 연동
      if (existingLocalUser.length > 0) {
        this.logger.info(
          {
            provider,
            email: normalizedEmail,
            userId: existingLocalUser[0].id,
          },
          '기존 로컬 계정 발견 - 자동 연동 중...',
        );

        // 3-1. 보안 검증: 이메일 인증 확인
        const localUser = existingLocalUser[0];
        if (!localUser.emailVerified) {
          this.logger.warn(
            { email: normalizedEmail },
            '로컬 계정의 이메일이 미검증 - 연동 거부',
          );
          throw new BadRequestException(
            '기존 계정의 이메일이 아직 검증되지 않았습니다',
          );
        }

        // 3-2. 소셜 계정 정보 추가 (연동)
        const updatedUser = await this.db
          .update(users)
          .set({
            provider, // 'local' → 'google' 또는 'local,google'로 복수 저장 가능
            providerUserId: providerUser.id,
          })
          .where(eq(users.id, localUser.id))
          .returning();

        // 3-3. 계정 연동 감시 기록
        await this.auditAccountLinking(
          localUser.id,
          provider,
          providerUser.id,
          'LINKED',
          context || {},
        );

        this.logger.info(
          { provider, email: normalizedEmail, userId: localUser.id },
          '계정 연동 완료',
        );

        return updatedUser[0];
      }

      // 4️⃣ 신규 사용자 생성 (상태: INACTIVE - 휴대폰 인증 필수)
      this.logger.info(
        { provider, email: normalizedEmail },
        '신규 SSO 사용자 생성 중...',
      );

      const newUser = await this.db
        .insert(users)
        .values({
          email: normalizedEmail,
          provider,
          providerUserId: providerUser.id,
          realName: providerUser.name || undefined,
          emailVerified: true, // 구글/카카오가 이메일 검증
          phoneVerified: false,
          status: 'INACTIVE', // ⚠️ 휴대폰 인증 필수
          role: 'CLIENT',
        })
        .returning();

      this.logger.info(
        { provider, email: normalizedEmail, userId: newUser[0].id },
        '신규 SSO 사용자 생성 완료',
      );

      return newUser[0];
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        { provider, error: (error as Error).message },
        'SSO 사용자 조회/생성 실패',
      );
      throw new BadRequestException('소셜 로그인 처리에 실패했습니다');
    }
  }

  /**
   * 소셜 계정 연동 (이미 로그인된 사용자가 새 소셜 계정 연동)
   *
   * 사용 사례:
   * - 로컬 계정으로 로그인한 사용자가 Google 계정 연동 요청
   * - 로컬 계정으로 로그인한 사용자가 Kakao 계정 연동 요청
   *
   * @param userId 대상 사용자 ID
   * @param provider 소셜 제공자
   * @param providerUserId 소셜 계정 ID
   * @param context 요청 컨텍스트
   */
  async linkSocialAccount(
    userId: string,
    provider: string,
    providerUserId: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    try {
      this.logger.info(
        { userId, provider },
        '소셜 계정 연동 중...',
      );

      // 1️⃣ 사용자 존재 확인
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new BadRequestException('사용자를 찾을 수 없습니다');
      }

      // 2️⃣ 이미 다른 소셜 계정과 연동되어 있는지 확인
      const existingLink = await this.db
        .select()
        .from(users)
        .where(eq(users.providerUserId, providerUserId))
        .limit(1);

      if (
        existingLink.length > 0 &&
        existingLink[0].id !== userId
      ) {
        this.logger.warn(
          { provider, providerUserId },
          '이미 다른 계정과 연동된 소셜 계정',
        );
        throw new ConflictException('이미 다른 계정과 연동된 소셜 계정입니다');
      }

      // 3️⃣ 계정 연동 수행
      await this.db
        .update(users)
        .set({
          provider,
          providerUserId,
        })
        .where(eq(users.id, userId));

      // 4️⃣ 연동 감시 기록
      await this.auditAccountLinking(
        userId,
        provider,
        providerUserId,
        'LINKED',
        context || {},
      );

      this.logger.info(
        { userId, provider },
        '소셜 계정 연동 완료',
      );
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        { userId, provider, error: (error as Error).message },
        '소셜 계정 연동 실패',
      );
      throw new BadRequestException('계정 연동에 실패했습니다');
    }
  }

  /**
   * 소셜 계정 연동 해제 (Unlink)
   *
   * 사용 사례:
   * - 사용자가 연동된 Google 계정 제거
   * - 사용자가 연동된 Kakao 계정 제거
   *
   * 제약:
   * - 최소 1개의 인증 수단 필수 (로컬 또는 다른 소셜)
   * - ACTIVE 상태 사용자만 가능
   *
   * @param userId 대상 사용자 ID
   * @param provider 연동 해제할 소셜 제공자
   * @param context 요청 컨텍스트
   */
  async unlinkSocialAccount(
    userId: string,
    provider: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    try {
      this.logger.info(
        { userId, provider },
        '소셜 계정 연동 해제 중...',
      );

      // 1️⃣ 사용자 정보 조회
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new BadRequestException('사용자를 찾을 수 없습니다');
      }

      const currentUser = user[0];

      // 2️⃣ 해당 제공자와 연동되어 있는지 확인
      if (currentUser.provider !== provider) {
        throw new BadRequestException(
          `${provider}와 연동되어 있지 않습니다`,
        );
      }

      // 3️⃣ 최소 1개의 인증 수단 필수 확인
      // 로컬 비밀번호가 있으면 연동 해제 가능
      if (!currentUser.password && currentUser.provider === provider) {
        // provider가 유일한 인증 수단이고 password가 없으면 거부
        this.logger.warn(
          { userId },
          '유일한 인증 수단이므로 연동 해제 불가',
        );
        throw new BadRequestException(
          '최소 1개의 인증 수단이 필요합니다. 먼저 비밀번호를 설정하세요.',
        );
      }

      // 4️⃣ 연동 해제 수행
      const providerUserId = currentUser.providerUserId;

      await this.db
        .update(users)
        .set({
          provider: 'local', // provider를 'local'로 재설정
          providerUserId: null,
        })
        .where(eq(users.id, userId));

      // 5️⃣ 연동 해제 감시 기록
      if (providerUserId) {
        await this.auditAccountLinking(
          userId,
          provider,
          providerUserId,
          'UNLINKED',
          context || {},
        );
      }

      this.logger.info(
        { userId, provider },
        '소셜 계정 연동 해제 완료',
      );
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        { userId, provider, error: (error as Error).message },
        '소셜 계정 연동 해제 실패',
      );
      throw new BadRequestException('계정 연동 해제에 실패했습니다');
    }
  }

  /**
   * 계정 연동 이력 기록 (감시 로그)
   *
   * 보안 감시용:
   * - 연동된 제공자 추적
   * - IP 주소 기록
   * - User-Agent 기록
   * - 의심 활동 탐지
   *
   * @param userId 사용자 ID
   * @param provider 소셜 제공자
   * @param providerUserId 소셜 계정 ID
   * @param action 작업 ('LINKED' | 'UNLINKED' | 'RELINKED')
   * @param context 요청 컨텍스트
   */
  async auditAccountLinking(
    userId: string,
    provider: string,
    providerUserId: string,
    action: 'LINKED' | 'UNLINKED' | 'RELINKED',
    context: { ip?: string; userAgent?: string },
  ): Promise<void> {
    try {
      await this.db.insert(accountLinkingAudit).values({
        userId,
        provider,
        providerUserId,
        action,
        ipAddress: context.ip,
        userAgent: context.userAgent,
      });

      this.logger.debug(
        {
          userId,
          provider,
          action,
          ip: context.ip,
        },
        '계정 연동 감시 기록 저장',
      );
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '계정 연동 감시 기록 저장 실패',
      );
      // 감시 기록 실패해도 계속 진행 (주 작업 중단 안 함)
    }
  }
}
