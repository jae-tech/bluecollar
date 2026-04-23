import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { EmailController } from './controllers/email.controller';
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

/**
 * Auth Domain Module
 *
 * 블루칼라 전문가의 계정 생성 및 인증 관련 모듈
 *
 * 아키텍처 원칙:
 * - Domain → Infrastructure 방향만 의존 (단방향)
 * - ConfigService를 통해 환경 변수 주입 (process.env 직접 참조 금지)
 * - OAuth 전략은 환경 변수 존재 여부로 조건부 활성화
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ConfigService 기반 JWT 비밀키 주입
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // @nestjs/jwt v11은 expiresIn에 StringValue 타입을 요구
          // string 캐스팅으로 타입 호환
          expiresIn:
            (config.get<string>(
              'JWT_ACCESS_EXPIRY',
              '15m',
            ) as unknown as number) || '15m',
        },
      }),
    }),

    DrizzleModule,
    SmsModule,
    EmailModule,
    LoggerModule,
  ],

  controllers: [AuthController, EmailController],

  providers: [
    AuthService,
    TokenService,
    EmailVerificationService,
    SsoService,
    EmailNormalizationService,
    JwtStrategy,
    LocalStrategy,
    // OAuth 전략은 환경 변수가 존재할 때만 등록
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
    ...(process.env.KAKAO_CLIENT_ID ? [KakaoStrategy] : []),
  ],

  exports: [AuthService, TokenService],
})
export class AuthModule {}
