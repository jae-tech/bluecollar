import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import { AdminDocumentsService } from '../services/admin-documents.service';
import { DocumentListQueryDto, RejectDocumentDto } from '../dtos/admin.dto';

/**
 * 관리자 사업자 서류 심사 컨트롤러
 *
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/documents')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDocumentsController {
  constructor(private readonly documentsService: AdminDocumentsService) {}

  /**
   * 사업자 서류 목록 조회
   *
   * status 필터로 PENDING/APPROVED/REJECTED 전체 조회 가능합니다.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사업자 서류 목록 조회' })
  async findAll(@Query() query: DocumentListQueryDto) {
    return this.documentsService.findAll(query);
  }

  /**
   * PENDING 서류 건수 조회 (네비게이션 배지용)
   */
  @Get('pending-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PENDING 서류 건수' })
  async pendingCount() {
    const count = await this.documentsService.countPending();
    return { count };
  }

  /**
   * 사업자 서류 승인
   */
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사업자 서류 승인' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.documentsService.approve(id, adminId);
  }

  /**
   * 사업자 서류 거절
   */
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사업자 서류 거절' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectDocumentDto,
  ) {
    return this.documentsService.reject(id, adminId, dto.reason);
  }
}
