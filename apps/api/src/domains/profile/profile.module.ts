import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { AuthModule } from '@/domains/auth/auth.module';

/**
 * Profile Module
 *
 * 워커 프로필 관리 기능을 제공합니다.
 * - 전문 분야(fields) 업데이트
 * - 활동 지역(areas) 업데이트
 * - 프로필 정보 조회
 *
 * Imports: DrizzleModule (데이터베이스 접근), AuthModule (TokenService — 온보딩 후 쿠키 갱신)
 * Controllers: ProfileController
 * Providers: ProfileService
 */
@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
