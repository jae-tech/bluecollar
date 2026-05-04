import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { SlackModule } from '@/infrastructure/slack/slack.module';
import { AuthModule } from '@/domains/auth/auth.module';
import { PortfolioModule } from '@/domains/portfolio/portfolio.module';
import { ProfileModule } from '@/domains/profile/profile.module';
import { PublicModule } from '@/domains/public/public.module';
import { UploadModule } from '@/domains/upload/upload.module';
import { CodesModule } from '@/domains/codes/codes.module';
import { AdminModule } from '@/domains/admin/admin.module';
import { WorkScheduleModule } from '@/domains/work-schedule/work-schedule.module';
import { InquiryModule } from '@/domains/inquiry/inquiry.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { envSchema } from '@/common/config/env.schema';

@Module({
  imports: [
    // 환경 변수 로드 및 Zod 검증
    // validate()가 실패하면 앱 시작 시 즉시 crash — 런타임 오류 방지
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validate: (config) => envSchema.parse(config),
    }),

    // 🕐 스케줄러 설정 (만료 코드 정리 Cron 등)
    ScheduleModule.forRoot(),

    // 🔒 Rate Limiting 설정
    // 기본: 60초에 10회 제한
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분 = 60,000ms
        limit: 10, // 기본 제한: 60초에 10회
      },
    ]),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          // OCI 헬스체크 등 노이즈성 경로 로그 제외
          autoLogging: {
            ignore: (req: { url?: string }) => req.url === '/health',
          },
          transport:
            config.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty' }
              : undefined,
        },
      }),
    }),

    DrizzleModule,
    SlackModule,
    AuthModule,
    PortfolioModule,
    ProfileModule,
    PublicModule,
    UploadModule,
    CodesModule,
    AdminModule,
    WorkScheduleModule,
    InquiryModule,
  ],
  providers: [
    // 🌐 전역 예외 필터 — DI로 등록해야 SlackNotificationService가 주입됨
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // 🔒 전역 Rate Limiter Guard 등록
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
