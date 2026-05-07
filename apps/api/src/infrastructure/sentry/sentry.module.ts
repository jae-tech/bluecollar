import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

/**
 * SentryModule
 *
 * 앱 시작 시 Sentry SDK를 초기화합니다.
 * Global 모듈로 등록하여 전역에서 Sentry.captureException() 사용 가능.
 *
 * 초기화 조건:
 * - SENTRY_DSN 환경 변수가 있어야 함
 * - production 또는 staging 환경에서만 활성화
 */
@Global()
@Module({})
export class SentryModule {
  static forRoot() {
    return {
      module: SentryModule,
      providers: [
        {
          provide: 'SENTRY_INIT',
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const dsn = config.get<string>('SENTRY_DSN');
            const env = config.get<string>('NODE_ENV', 'development');

            if (!dsn) {
              // DSN 없으면 Sentry 비활성화 (개발 환경에서 정상)
              return null;
            }

            Sentry.init({
              dsn,
              environment: env,
              // 프로덕션에서 트레이스 10% 샘플링 (성능 영향 최소화)
              tracesSampleRate: env === 'production' ? 0.1 : 1.0,
              // 소스맵으로 원본 코드 위치 표시
              includeLocalVariables: true,
            });

            return Sentry;
          },
        },
      ],
    };
  }
}
