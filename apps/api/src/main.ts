import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { AllExceptionsFilter } from '@/common';
import * as path from 'path';

async function bootstrap(): Promise<void> {
  // 1. Fastify 어댑터 적용
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }), // Fastify 자체 로거 활용
    { bufferLogs: true },
  );

  // 1-1. Multipart 플러그인 등록
  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // 1-2. 정적 파일 서빙 (업로드된 미디어 파일)
  await app.register(fastifyStatic as any, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/media/',
  });

  // 2. Pino 로거 연결 (2026 최신 트렌드)
  const logger = app.get(Logger);
  app.useLogger(logger);

  // 2-1. 전역 예외 필터 등록
  app.useGlobalFilters(new AllExceptionsFilter(logger as any));

  // 3. 전역 파이프 설정 (DTO 유효성 검사)
  app.useGlobalPipes(new ZodValidationPipe());

  // 4. Swagger 설정 (수동 설정 - 플러그인 비활성화)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BlueCollar API')
    .setDescription('블루칼라 전문가 포트폴리오 플랫폼 API')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access_token',
    )
    .addTag('Auth', '인증 관련 API')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
    },
  });

  // 5. CORS (서브도메인 대응)
  app.enableCors({
    origin: [/\.bluecollar\.cv$/, /localhost:\d+$/],
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0'); // Fastify는 0.0.0.0 지정이 권장됨
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
