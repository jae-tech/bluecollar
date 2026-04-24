import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminDashboardService } from '../services/admin-dashboard.service';

/**
 * 관리자 대시보드 컨트롤러
 *
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/dashboard')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  /**
   * 운영 현황 요약
   *
   * 유저 수, 워커 수, 최근 신규 가입자를 반환합니다.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 대시보드 집계' })
  async getSummary() {
    return this.dashboardService.getSummary();
  }
}
