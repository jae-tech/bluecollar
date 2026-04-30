import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminCodesController } from './controllers/admin-codes.controller';
import { AdminInboxController } from './controllers/admin-inbox.controller';
import { AdminDocumentsController } from './controllers/admin-documents.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { AdminNotificationController } from './controllers/admin-notification.controller';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminCodesService } from './services/admin-codes.service';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminInboxService } from './services/admin-inbox.service';
import { AdminDocumentsService } from './services/admin-documents.service';
import { AdminNotificationService } from './services/admin-notification.service';

/**
 * Admin Domain Module
 *
 * 관리자 전용 기능을 담당합니다.
 * - 대시보드: 운영 현황 집계
 * - 유저 관리: 목록 조회, 상세 조회, 상태/역할 변경
 * - 코드 관리: masterCodes CRUD, 정렬 순서 변경
 * - 서류 심사: 사업자등록증 승인/거절, manualReviews 기록
 * - 감사 로그: 모든 변경 이력 조회
 * - 실시간 알림: SSE 기반 NEW_USER / NEW_DOCUMENT 이벤트
 *
 * 모든 엔드포인트는 ADMIN 역할 필요 (JwtAuthGuard + RolesGuard)
 */
@Module({
  imports: [DrizzleModule, LoggerModule, ConfigModule],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminCodesController,
    AdminInboxController,
    AdminDocumentsController,
    AdminAuditController,
    AdminNotificationController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminCodesService,
    AdminAuditService,
    AdminInboxService,
    AdminDocumentsService,
    AdminNotificationService,
  ],
})
export class AdminModule {}
