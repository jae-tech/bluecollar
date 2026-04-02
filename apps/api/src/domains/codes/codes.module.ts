import { Module } from '@nestjs/common';
import { CodesController } from './controllers/codes.controller';
import { CodesService } from './services/codes.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';

/**
 * Codes Module
 *
 * 마스터 코드 조회 API를 제공합니다.
 * - 업종(FIELD), 숙련도(EXP), 사업자 유형(BIZ), 지역(AREA), 스킬 태그(SKILL_TAG) 조회
 * - 모든 엔드포인트는 Public (토큰 불필요)
 *
 * Imports: DrizzleModule (데이터베이스 접근)
 * Controllers: CodesController
 * Providers: CodesService
 */
@Module({
  imports: [DrizzleModule],
  controllers: [CodesController],
  providers: [CodesService],
  exports: [CodesService],
})
export class CodesModule {}
