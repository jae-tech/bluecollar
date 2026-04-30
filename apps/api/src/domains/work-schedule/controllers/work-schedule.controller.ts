import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { WorkScheduleService } from '../services/work-schedule.service';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  GetWorkSchedulesQueryDto,
} from '../dtos/work-schedule.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';

/**
 * 작업 일정 컨트롤러
 *
 * JwtAuthGuard는 전역 등록되어 있으므로 별도 선언 불필요.
 * workerProfileId 없는 사용자(CLIENT, ADMIN)는 ForbiddenException 반환.
 */
@Controller('schedule')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  /**
   * 현재 로그인 워커의 workerProfileId를 반환.
   * WORKER 역할이 아니면 403 ForbiddenException.
   */
  private getWorkerProfileId(user: UserPayload): string {
    if (!user.workerProfileId) {
      throw new ForbiddenException('워커 프로필이 없습니다');
    }
    return user.workerProfileId;
  }

  /**
   * GET /schedule?year=2026&month=4
   *
   * 월별 작업 일정 조회. 멀티월 일정 포함.
   */
  @Get()
  async getSchedules(
    @CurrentUser() user: UserPayload,
    @Query() query: GetWorkSchedulesQueryDto,
  ) {
    const workerProfileId = this.getWorkerProfileId(user);
    return this.workScheduleService.getSchedules(
      workerProfileId,
      query.year,
      query.month,
    );
  }

  /**
   * POST /schedule
   *
   * 작업 일정 등록. 충돌 있어도 등록 허용 (conflicts 배열로 반환).
   * HTTP 201
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateWorkScheduleDto,
  ) {
    const workerProfileId = this.getWorkerProfileId(user);
    return this.workScheduleService.createSchedule(workerProfileId, dto);
  }

  /**
   * PATCH /schedule/:id
   *
   * 작업 일정 수정. 소유권 검증은 서비스 DB 레벨에서 수행.
   * HTTP 200
   */
  @Patch(':id')
  async updateSchedule(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWorkScheduleDto,
  ) {
    const workerProfileId = this.getWorkerProfileId(user);
    return this.workScheduleService.updateSchedule(id, workerProfileId, dto);
  }

  /**
   * DELETE /schedule/:id
   *
   * 작업 일정 삭제. 소유권 검증은 서비스 DB 레벨에서 수행.
   * HTTP 204
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSchedule(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    const workerProfileId = this.getWorkerProfileId(user);
    return this.workScheduleService.deleteSchedule(id, workerProfileId);
  }
}
