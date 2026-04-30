import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminNotificationService } from '../services/admin-notification.service';

/**
 * 관리자 실시간 알림 SSE 컨트롤러
 *
 * 브라우저 EventSource가 직접 OCI 백엔드에 연결합니다.
 * Cloudflare Workers를 거치지 않으므로 SSE 스트리밍이 정상 동작합니다.
 */
@Controller('admin/notifications')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminNotificationController {
  constructor(private readonly notificationService: AdminNotificationService) {}

  /**
   * SSE 스트림 엔드포인트
   *
   * NestJS Fastify에서 `res.raw || res` 패턴으로 Node.js ServerResponse에
   * 직접 파이프되므로 SSE가 정상 동작합니다.
   */
  @Sse('stream')
  @ApiOperation({ summary: '관리자 실시간 알림 SSE 스트림' })
  stream(): Observable<MessageEvent> {
    return this.notificationService.getStream();
  }
}
