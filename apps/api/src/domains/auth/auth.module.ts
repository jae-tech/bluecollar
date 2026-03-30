import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { EmailVerificationService } from './services/email-verification.service';
import { SsoService } from './services/sso.service';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { LocalStrategy } from '@/common/strategies/local.strategy';
import { GoogleStrategy } from '@/common/strategies/google.strategy';
import { KakaoStrategy } from '@/common/strategies/kakao.strategy';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { SmsModule } from '@/infrastructure/sms/sms.module';
import { EmailModule } from '@/infrastructure/email/email.module';
import { LoggerModule } from 'nestjs-pino';
import { EmailNormalizationService } from '@/common/services/email-normalization.service';

// 🔧 환경 변수 기반 Strategy 조건부 로드 함수
const getOAuthStrategies = (): any[] => {
  const strategies: any[] = [];

  // Google OAuth: clientID가 'mock'이 아니면 로드
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'mock') {
    strategies.push(GoogleStrategy);
  }

  // Kakao OAuth: clientID가 'mock'이 아니면 로드
  if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_ID !== 'mock') {
    strategies.push(KakaoStrategy);
  }

  return strategies;
};

/**
 * Auth Domain Module
 *
 * 블루칼라 전문가의 계정 생성 및 인증 관련 모듈
 *
 * 포함 요소:
 * - AuthController: REST API 엔드포인트 (회원가입, 인증번호 발송/검증)
 * - AuthService: 비즈니스 로직 (회원가입 프로세스, 인증 검증)
 *
 * 의존성 구조 (Domain-Driven Design):
 * AuthService (비즈니스 로직)
 *   ├── DrizzleModule (Infrastructure - 데이터베이스)
 *   ├── SmsModule (Infrastructure - SMS 서비스)
 *   └── LoggerModule (Infrastructure - 로깅)
 *
 * 아키텍처 원칙:
 * - 순환 참조 없음 ✓
 * - Domain → Infrastructure 방향만 의존 (단방향)
 * - Infrastructure는 Domain에 의존하지 않음
 */
@Module({
  // 외부 의존 모듈 주입
  // - PassportModule: Passport.js 전략 프레임워크 (Local, JWT, Google, Kakao 전략)
  // - JwtModule: JWT 토큰 생성 및 검증
  // - DrizzleModule: PostgreSQL 데이터베이스 연결
  // - SmsModule: SMS 발송 서비스 (SMS 공급자 추상화)
  // - EmailModule: 이메일 발송 서비스 (Mock/Nodemailer 선택 가능)
  // - LoggerModule: Pino 기반 구조화된 로깅
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
    DrizzleModule,
    SmsModule,
    EmailModule,
    LoggerModule,
  ],

  // HTTP 요청을 처리하는 컨트롤러
  controllers: [AuthController],

  // 비즈니스 로직을 구현하는 서비스 프로바이더
  //
  // 🔐 Passport 전략:
  // - JwtStrategy: JWT 토큰 검증 전략 (항상 활성화)
  // - LocalStrategy: 이메일 + 비밀번호 인증 전략 (항상 활성화)
  // - GoogleStrategy: Google OAuth2 전략 (GOOGLE_CLIENT_ID가 'mock'이 아닐 때만 로드)
  // - KakaoStrategy: Kakao OAuth2 전략 (KAKAO_CLIENT_ID가 'mock'이 아닐 때만 로드)
  //
  // 📧 인증 서비스:
  // - AuthService: 사용자 인증 및 회원가입 비즈니스 로직
  // - TokenService: JWT 토큰 생성, 갱신, 폐기
  // - EmailVerificationService: 이메일 인증 코드 생성/검증
  // - SsoService: SSO 프로필 처리 및 계정 연동 (Account Linking)
  // - EmailNormalizationService: 이메일 정규화 및 일회용 이메일 검사
  providers: [
    AuthService,
    TokenService,
    EmailVerificationService,
    SsoService,
    EmailNormalizationService,
    JwtStrategy,
    LocalStrategy,
    ...getOAuthStrategies(), // 조건부 로드: mock이 아니면 Google/Kakao Strategy 포함
  ],

  // 다른 모듈에서 사용할 수 있도록 export
  // - AuthService: 사용자 정보 조회
  // - TokenService: 토큰 관련 작업
  exports: [AuthService, TokenService],
})
export class AuthModule {}
