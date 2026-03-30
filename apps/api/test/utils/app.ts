import { Test, TestingModule } from '@nestjs/testing';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import type { Logger } from 'nestjs-pino';

/**
 * Test용 NestJS 애플리케이션 생성
 *
 * 다음을 설정:
 * 1. Fastify 어댑터 (logger 비활성화)
 * 2. Zod DTO 검증 파이프
 * 3. Pino 로거 연결 (사용 가능한 경우)
 * 4. 모듈 초기화 및 HTTP 어댑터 준비
 */
export async function createTestApp(): Promise<NestFastifyApplication> {
  // NestJS Testing Module 컴파일 (AppModule 포함)
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Fastify 기반 NestJS 애플리케이션 생성
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }), // Test 환경에서는 Fastify 로거 비활성화
  );

  // 전역 파이프: Zod를 사용한 DTO 검증
  app.useGlobalPipes(new ZodValidationPipe());

  // Pino Logger 연결 (사용 가능한 경우만)
  // LoggerModule이 제대로 초기화되었으면 Logger를 가져올 수 있음
  try {
    const logger = app.get(Logger);
    if (logger) {
      app.useLogger(logger);
    }
  } catch (error) {
    // Logger를 가져올 수 없는 경우도 무시하고 진행
    // (Test 환경에서는 로깅이 필수는 아님)
    console.log('Warning: Pino logger not available in test environment');
  }

  // 애플리케이션 초기화
  await app.init();
  // Fastify 어댑터의 HTTP 서버 준비
  await app.getHttpAdapter().getInstance().ready();

  return app;
}

/**
 * Test용 NestJS 애플리케이션 종료
 *
 * 데이터베이스 연결, 이벤트 리스너 등을 정리
 */
export async function closeTestApp(app: NestFastifyApplication | undefined) {
  // app이 undefined일 수 있으므로 체크
  if (app) {
    try {
      await app.close();
    } catch (error) {
      // 종료 중 에러 발생해도 무시 (다른 정리 작업은 여전히 진행됨)
      console.warn('Error closing test app:', error);
    }
  }
}
