import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ForbiddenException,
  Logger,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import { InquiryService } from '../services/inquiry.service';
import {
  CreateInquiryDto,
  UpdateInquiryStatusDto,
  GetInquiriesQueryDto,
} from '../dtos/inquiry.dto';

/**
 * InquiryController
 *
 * 클라이언트-워커 의뢰 시스템 API 엔드포인트.
 *
 * ⚠️ 라우트 순서: 리터럴 경로(/client)를 파라미터 경로(/:id) 앞에 선언해야 합니다.
 *
 * 클라이언트 역할:
 *   POST   /inquiries/:workerSlug        — 의뢰 제출
 *   GET    /inquiries/client             — 내 의뢰 내역
 *   PATCH  /inquiries/:id/cancel         — 의뢰 취소
 *
 * 워커 역할:
 *   GET    /inquiries/worker             — 받은 의뢰 목록
 *   PATCH  /inquiries/:id/status         — 의뢰 상태 변경
 */
@Controller('inquiries')
@UseGuards(RolesGuard)
export class InquiryController {
  private readonly logger = new Logger(InquiryController.name);

  constructor(private readonly inquiryService: InquiryService) {}

  // ─────────────────────────────────────────────────────
  // 리터럴 경로 (파라미터 경로 앞에 선언)
  // ─────────────────────────────────────────────────────

  /**
   * 클라이언트 — 자신이 보낸 의뢰 목록 조회
   * GET /inquiries/client
   */
  @Get('client')
  @Roles('CLIENT')
  async getClientInquiries(
    @CurrentUser() user: UserPayload,
    @Query() query: GetInquiriesQueryDto,
  ) {
    return this.inquiryService.getInquiriesForClient(
      user.id,
      query.status,
      query.limit,
      query.offset,
    );
  }

  /**
   * 워커 — 받은 의뢰 목록 조회
   * GET /inquiries/worker
   */
  @Get('worker')
  @Roles('WORKER')
  async getWorkerInquiries(
    @CurrentUser() user: UserPayload,
    @Query() query: GetInquiriesQueryDto,
  ) {
    const workerProfileId = user.workerProfileId;
    if (!workerProfileId) {
      throw new ForbiddenException(
        '워커 프로필이 없습니다. 워커 프로필을 먼저 생성하세요.',
      );
    }

    return this.inquiryService.getInquiriesForWorker(
      workerProfileId,
      query.status,
      query.limit,
      query.offset,
    );
  }

  // ─────────────────────────────────────────────────────
  // 파라미터 경로
  // ─────────────────────────────────────────────────────

  /**
   * 클라이언트 — 워커에게 의뢰 제출
   * POST /inquiries/:workerSlug
   */
  @Post(':workerSlug')
  @Roles('CLIENT')
  async createInquiry(
    @CurrentUser() user: UserPayload,
    @Param('workerSlug') workerSlug: string,
    @Body() dto: CreateInquiryDto,
  ) {
    return this.inquiryService.createInquiry(user.id, workerSlug, dto);
  }

  /**
   * 워커 — 의뢰 상태 변경 (READ, REPLIED, ACCEPTED, DECLINED)
   * PATCH /inquiries/:id/status
   */
  @Patch(':id/status')
  @Roles('WORKER')
  async updateInquiryStatus(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    const workerProfileId = user.workerProfileId;
    if (!workerProfileId) {
      throw new ForbiddenException(
        '워커 프로필이 없습니다. 워커 프로필을 먼저 생성하세요.',
      );
    }

    return this.inquiryService.updateInquiryStatus(id, workerProfileId, dto);
  }

  /**
   * 클라이언트 — 의뢰 취소
   * PATCH /inquiries/:id/cancel
   */
  @Patch(':id/cancel')
  @Roles('CLIENT')
  async cancelInquiry(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inquiryService.cancelInquiry(id, user.id);
  }
}
