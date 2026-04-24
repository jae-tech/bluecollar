import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import { AdminCodesService } from '../services/admin-codes.service';
import {
  CreateCodeDto,
  UpdateCodeDto,
  ReorderCodesDto,
} from '../dtos/admin.dto';

/**
 * 관리자 코드 관리 컨트롤러
 *
 * masterCodes 테이블의 CRUD 및 정렬 순서 변경을 담당합니다.
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/codes')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCodesController {
  constructor(private readonly codesService: AdminCodesService) {}

  /**
   * 코드 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코드 목록 조회 (그룹 필터 가능)' })
  @ApiQuery({
    name: 'group',
    required: false,
    description: 'FIELD, AREA, EXP 등',
  })
  async findAll(@Query('group') group?: string) {
    return this.codesService.findAll(group);
  }

  /**
   * 코드 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '코드 생성' })
  async create(@Body() dto: CreateCodeDto, @CurrentUser() admin: UserPayload) {
    return this.codesService.create(admin.id, dto);
  }

  /**
   * 코드 정렬 순서 일괄 변경
   *
   * 드래그앤드롭 결과를 반영합니다.
   * /admin/codes/:code PATCH보다 앞에 등록해야 라우팅 충돌이 없습니다.
   */
  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코드 정렬 순서 일괄 변경' })
  async reorder(
    @Body() dto: ReorderCodesDto,
    @CurrentUser() admin: UserPayload,
  ) {
    return this.codesService.reorder(admin.id, dto);
  }

  /**
   * 코드 수정 (name, sortOrder)
   */
  @Patch(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코드 수정' })
  async update(
    @Param('code') code: string,
    @Body() dto: UpdateCodeDto,
    @CurrentUser() admin: UserPayload,
  ) {
    return this.codesService.update(admin.id, code, dto);
  }

  /**
   * 코드 삭제
   *
   * 사용 중인 코드(workerFields, workerAreas 참조)는 삭제할 수 없습니다.
   */
  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '코드 삭제 (참조 없는 경우만 가능)' })
  async remove(@Param('code') code: string, @CurrentUser() admin: UserPayload) {
    return this.codesService.remove(admin.id, code);
  }
}
