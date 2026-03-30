import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SsoService } from '@/domains/auth/services/sso.service';

/**
 * Kakao OAuth Strategy
 *
 * Kakao OAuth2를 통한 소셜 로그인 구현입니다.
 * GET /auth/login/kakao 에서 @UseGuards(AuthGuard('kakao'))로 시작됩니다.
 *
 * 플로우:
 * 1. 사용자가 "카카오로 로그인" 버튼 클릭
 * 2. Kakao 동의 화면으로 리다이렉트
 * 3. 사용자가 승인 후 콜백 URL로 반환
 * 4. 이 전략이 validate() 메서드를 호출하여 사용자 정보 처리
 * 5. 기존 로컬 계정이 있으면 자동 연동 (Account Linking)
 * 6. 없으면 새 사용자 생성 (상태: INACTIVE - 휴대폰 인증 필수)
 *
 * 🔒 보안:
 * - Kakao가 이메일 검증을 완료했으므로 emailVerified=true
 * - 휴대폰 인증은 별도로 요구 (1인 1계정 원칙)
 * - 계정 연동 시 IP와 User-Agent 기록 (보안 감시)
 *
 * 📧 이메일 기반 계정 연동:
 * - Kakao 이메일 == 로컬 계정 이메일 → 자동 연동
 * - 로컬 계정 없음 → 신규 계정 생성
 * - 여러 Kakao 계정으로 시도 → 각각 다른 계정 취급
 *
 * 환경 변수:
 * - KAKAO_CLIENT_ID: Kakao Application ID (REST API Key)
 * - KAKAO_CLIENT_SECRET: Kakao Client Secret (Admin Key에서 추출)
 * - KAKAO_CALLBACK_URL: http://localhost:3000/auth/callback/kakao
 *
 * 사용 예시:
 * 1. GET /auth/login/kakao → Kakao 동의 화면
 * 2. GET /auth/callback/kakao → validate() 호출 → 토큰 발급 또는 리다이렉트
 */
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private ssoService: SsoService,
    private readonly logger: PinoLogger,
  ) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:3000/auth/callback/kakao',
    });

    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(KakaoStrategy.name);
    }

    this.logger.info(
      { callbackURL: this.getCallbackUrl() },
      '🟨 Kakao OAuth Strategy 초기화',
    );
  }

  /**
   * Kakao OAuth 콜백 처리
   *
   * Kakao로부터 사용자 정보를 받아 DB에서 찾거나 생성합니다.
   * - 기존 SSO 계정 발견 → 로그인
   * - 기존 로컬 계정 발견 → 자동 연동 (Account Linking)
   * - 신규 사용자 → 새 계정 생성 (INACTIVE 상태)
   *
   * ⚠️ Kakao 특이사항:
   * - 이메일은 선택적 정보 (사용자가 거부할 수 있음)
   * - 거부 시 nickname@kakao.temp 형식의 임시 이메일 생성
   * - 사용자 프로필 사진, 별명 등 추가 정보 활용 가능
   *
   * @param accessToken Kakao OAuth 액세스 토큰
   * @param refreshToken Kakao OAuth 리프레시 토큰 (있을 경우)
   * @param profile Kakao 프로필 정보
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
    // 📧 Kakao 프로필에서 이메일 추출
    // - 사용자가 이메일 공유를 거부하면 undefined
    // - 이 경우 임시 이메일 생성 (나중에 업데이트 가능)
    const kakaoEmail =
      profile.emails?.[0]?.value ||
      profile._json?.kakao_account?.email ||
      `${profile.id}@kakao.temp`; // 이메일 없을 경우 임시 이메일

    const kakaoProfile = {
      id: profile.id.toString(),
      displayName: profile.displayName || profile.nickname || '',
      name: profile.displayName || profile.nickname || '',
      email: kakaoEmail,
      profileImageUrl: profile._json?.properties?.profile_image,
      nickname: profile.nickname,
    };

    this.logger.info(
      {
        kakaoId: kakaoProfile.id,
        email: kakaoProfile.email,
        displayName: kakaoProfile.displayName,
        hasRealEmail: !kakaoEmail.endsWith('@kakao.temp'),
      },
      '🟨 Kakao OAuth 프로필 수신',
    );

    try {
      // 🔍 SSO 서비스로 사용자 찾기/생성
      // - 기존 Kakao 계정 있으면 반환
      // - 기존 로컬 계정 있으면 자동 연동 후 반환
      // - 없으면 새 계정 생성 후 반환
      const user = await this.ssoService.findOrCreateSsoUser(
        'kakao',
        kakaoProfile,
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
        '✓ Kakao OAuth 사용자 확인/생성 완료',
      );

      // ✅ 검증 성공 - 사용자 객체 반환
      // request.user에 설정되고, 콜백 URL로 리다이렉트
      done(null, user);
    } catch (error) {
      this.logger.error(
        {
          kakaoId: kakaoProfile.id,
          email: kakaoProfile.email,
          error: (error as Error).message,
        },
        '❌ Kakao OAuth 처리 중 에러',
      );

      // ❌ 검증 실패
      done(error);
    }
  }

  /**
   * 콜백 URL 반환 (테스트/로깅용)
   */
  private getCallbackUrl(): string {
    return process.env.KAKAO_CALLBACK_URL || 'http://localhost:3000/auth/callback/kakao';
  }
}
