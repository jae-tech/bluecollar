import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminAuditService } from '../services/admin-audit.service';
import { AuditLogQueryDto } from '../dtos/admin.dto';

/**
 * 관리자 감사 로그 조회 컨트롤러
 *
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/audit')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  /**
   * 감사 로그 목록 조회
   *
   * action / adminId 필터, 최신순 페이지네이션을 지원합니다.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 감사 로그 조회' })
  async findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAll(query);
  }
}
