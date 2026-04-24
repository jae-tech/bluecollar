import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminInboxService } from '../services/admin-inbox.service';

/**
 * 관리자 수신함 컨트롤러
 *
 * support@bluecollar.cv IMAP 수신함을 조회합니다.
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/inbox')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminInboxController {
  constructor(private readonly inboxService: AdminInboxService) {}

  /**
   * 수신함 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'support@ 수신함 목록 (IMAP)' })
  async list(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    if (!this.inboxService.isConfigured()) {
      throw new ServiceUnavailableException('IMAP 설정이 되어 있지 않습니다');
    }
    return this.inboxService.listMessages(page, limit);
  }

  /**
   * 메시지 상세 조회 (UID 기반, 읽음 처리 포함)
   */
  @Get(':uid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '수신 메시지 상세 조회' })
  async detail(@Param('uid', ParseIntPipe) uid: number) {
    if (!this.inboxService.isConfigured()) {
      throw new ServiceUnavailableException('IMAP 설정이 되어 있지 않습니다');
    }
    const msg = await this.inboxService.getMessage(uid);
    if (!msg) {
      throw new ServiceUnavailableException('메시지를 찾을 수 없습니다');
    }
    return msg;
  }
}
