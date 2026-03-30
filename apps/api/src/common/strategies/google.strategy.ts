import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SsoService } from '@/domains/auth/services/sso.service';

/**
 * Google OAuth Strategy
 *
 * Google OAuth2를 통한 소셜 로그인 구현입니다.
 * GET /auth/login/google 에서 @UseGuards(AuthGuard('google'))로 시작됩니다.
 *
 * 플로우:
 * 1. 사용자가 "Google로 로그인" 버튼 클릭
 * 2. Google 동의 화면으로 리다이렉트
 * 3. 사용자가 승인 후 콜백 URL로 반환
 * 4. 이 전략이 validate() 메서드를 호출하여 사용자 정보 처리
 * 5. 기존 로컬 계정이 있으면 자동 연동 (Account Linking)
 * 6. 없으면 새 사용자 생성 (상태: INACTIVE - 휴대폰 인증 필수)
 *
 * 🔒 보안:
 * - Google이 이메일 검증을 완료했으므로 emailVerified=true
 * - 휴대폰 인증은 별도로 요구 (1인 1계정 원칙)
 * - 계정 연동 시 IP와 User-Agent 기록 (보안 감시)
 *
 * 📧 이메일 기반 계정 연동:
 * - Google 이메일 == 로컬 계정 이메일 → 자동 연동
 * - 로컬 계정 없음 → 신규 계정 생성
 * - 여러 Google 계정으로 시도 → 각각 다른 계정 취급
 *
 * 환경 변수:
 * - GOOGLE_CLIENT_ID: Google OAuth Application ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth Client Secret
 * - GOOGLE_CALLBACK_URL: http://localhost:3000/auth/callback/google
 *
 * 사용 예시:
 * 1. GET /auth/login/google → Google 동의 화면
 * 2. GET /auth/callback/google → validate() 호출 → 토큰 발급 또는 리다이렉트
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private ssoService: SsoService,
    private readonly logger: PinoLogger,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/callback/google',
      scope: ['profile', 'email'],
    });

    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(GoogleStrategy.name);
    }

    this.logger.info(
      { callbackURL: this.getCallbackUrl() },
      '🔵 Google OAuth Strategy 초기화',
    );
  }

  /**
   * Google OAuth 콜백 처리
   *
   * Google으로부터 사용자 정보를 받아 DB에서 찾거나 생성합니다.
   * - 기존 SSO 계정 발견 → 로그인
   * - 기존 로컬 계정 발견 → 자동 연동 (Account Linking)
   * - 신규 사용자 → 새 계정 생성 (INACTIVE 상태)
   *
   * @param accessToken Google OAuth 액세스 토큰
   * @param refreshToken Google OAuth 리프레시 토큰
   * @param profile Google 프로필 정보
   * @param done 콜백 함수 (Passport 표준)
   *
   * done 콜백:
   * - done(null, user): 검증 성공 → request.user에 user 객체 설정
   * - done(error): 검증 실패 → 401/403 에러
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    const googleProfile = {
      id: profile.id,
      displayName: profile.displayName,
      name: profile.name?.givenName || profile.displayName,
      email: profile.emails?.[0]?.value || '',
    };

    this.logger.info(
      {
        googleId: googleProfile.id,
        email: googleProfile.email,
        displayName: googleProfile.displayName,
      },
      '🔵 Google OAuth 프로필 수신',
    );

    try {
      // 🔍 SSO 서비스로 사용자 찾기/생성
      // - 기존 Google 계정 있으면 반환
      // - 기존 로컬 계정 있으면 자동 연동 후 반환
      // - 없으면 새 계정 생성 후 반환
      const user = await this.ssoService.findOrCreateSsoUser(
        'google',
        googleProfile,
        {
          ip: '', // 🔒 나중에 컨트롤러에서 요청 정보 주입
          userAgent: '',
        },
      );

      this.logger.info(
        {
          userId: user.id,
          email: user.email,
          status: user.status,
        },
        '✓ Google OAuth 사용자 확인/생성 완료',
      );

      // ✅ 검증 성공 - 사용자 객체 반환
      // request.user에 설정되고, 콜백 URL로 리다이렉트
      done(null, user);
    } catch (error) {
      this.logger.error(
        {
          googleId: googleProfile.id,
          email: googleProfile.email,
          error: (error as Error).message,
        },
        '❌ Google OAuth 처리 중 에러',
      );

      // ❌ 검증 실패
      done(error);
    }
  }

  /**
   * 콜백 URL 반환 (테스트/로깅용)
   */
  private getCallbackUrl(): string {
    return process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/callback/google';
  }
}
