import { Module } from '@nestjs/common';
import { PublicController } from './controllers/public.controller';
import { PublicService } from './services/public.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';

/**
 * Public Module
 *
 * 토큰 없이 누구나 접근 가능한 공개 API를 제공합니다.
 * - 공개 프로필 조회 (Slug 기반)
 * - 포트폴리오 정보 공개 조회
 *
 * Imports: DrizzleModule (데이터베이스 접근)
 * Controllers: PublicController
 * Providers: PublicService
 */
@Module({
  imports: [DrizzleModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
