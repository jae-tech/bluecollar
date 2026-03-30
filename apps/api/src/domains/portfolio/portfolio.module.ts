import { Module } from '@nestjs/common';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioService } from './services/portfolio.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';

/**
 * Portfolio Module
 *
 * 워커의 포트폴리오(시공 사례) 관리 기능을 제공합니다.
 * - 포트폴리오 생성, 조회
 * - 포트폴리오 미디어(이미지, 비디오, PDF) 관리
 *
 * Imports: DrizzleModule (데이터베이스 접근)
 * Controllers: PortfolioController
 * Providers: PortfolioService
 */
@Module({
  imports: [DrizzleModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
