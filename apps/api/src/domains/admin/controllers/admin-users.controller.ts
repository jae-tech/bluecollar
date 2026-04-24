import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import { AdminUsersService } from '../services/admin-users.service';
import {
  UserListQueryDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
} from '../dtos/admin.dto';

/**
 * 관리자 유저 관리 컨트롤러
 *
 * ADMIN 역할만 접근 가능합니다.
 */
@Controller('admin/users')
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  /**
   * 유저 목록 조회
   *
   * 이메일/이름 검색, 상태·역할 필터, 페이지네이션을 지원합니다.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '유저 목록 조회 (검색/필터/페이지네이션)' })
  async findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * 유저 상태 변경
   *
   * ACTIVE / SUSPENDED / DELETED 상태로 변경합니다.
   * 본인 계정은 변경할 수 없습니다.
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '유저 상태 변경 (ACTIVE/SUSPENDED/DELETED)' })
  async updateStatus(
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: UserPayload,
  ) {
    return this.usersService.updateStatus(admin.id, targetUserId, dto.status);
  }

  /**
   * 유저 역할 변경
   *
   * ADMIN / WORKER / CLIENT 역할로 변경합니다.
   * 본인 계정은 변경할 수 없습니다.
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '유저 역할 변경 (ADMIN/WORKER/CLIENT)' })
  async updateRole(
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: UserPayload,
  ) {
    return this.usersService.updateRole(admin.id, targetUserId, dto.role);
  }
}
