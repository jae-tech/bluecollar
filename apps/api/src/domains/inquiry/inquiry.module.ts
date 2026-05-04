import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { InquiryController } from './controllers/inquiry.controller';
import { InquiryService } from './services/inquiry.service';
import { InquiryEmailService } from './services/inquiry-email.service';

/**
 * InquiryModule
 *
 * 클라이언트-워커 의뢰 시스템 모듈.
 *
 * Imports: DrizzleModule (데이터베이스 접근)
 * Controllers: InquiryController
 * Providers: InquiryService, InquiryEmailService
 */
@Module({
  imports: [DrizzleModule],
  controllers: [InquiryController],
  providers: [InquiryService, InquiryEmailService],
  exports: [InquiryService],
})
export class InquiryModule {}
