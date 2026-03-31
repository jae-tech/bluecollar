import {
  Controller,
  Patch,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { PinoLogger } from 'nestjs-pino';
import { ProfileService } from '../services/profile.service';
import { Public } from '@/common/decorators/public.decorator';
import { OwnershipGuard } from '@/common/guards/ownership.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import {
  UpdateWorkerProfileBodyDto,
  UpdateWorkerProfileBodySchema,
  UpdateWorkerProfileInfoDto,
  UpdateWorkerProfileInfoSchema,
} from '../dtos/update-profile.dto';
import {
  CompleteOnboardingDto,
  CompleteOnboardingSchema,
} from '../dtos/complete-onboarding.dto';

/**
 * Profile Controller
 *
 * 워커 프로필 관리 API 엔드포인트를 제공합니다.
 * - GET /workers/me: 내 워커 프로필 조회
 * - POST /workers/onboarding: 온보딩 완료
 * - PATCH /workers/profile/:workerProfileId: 전문 분야 및 활동 지역 업데이트
 * - PATCH /workers/profile/:workerProfileId/info: 프로필 핵심 정보 수정
 * - GET /workers/profile/:workerProfileId: 워커 프로필 조회
 */
@Controller('workers')
@ApiTags('Profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(ProfileController.name);
    }
  }

  /**
   * 워커 프로필 업데이트
   *
   * 워커의 전문 분야(fieldCodes)와 활동 지역(areaCodes)을 업데이트합니다.
   * - 기존 데이터는 먼저 삭제되고 새로운 데이터로 재삽입됩니다 (트랜잭션)
   * - 전문 분야 또는 활동 지역 중 적어도 하나는 제공되어야 합니다.
   *
   * @param workerProfileId 워커 프로필 ID (경로 파라미터)
   * @param updateDto 업데이트 요청 데이터 (fieldCodes, areaCodes)
   * @returns 업데이트된 전문 분야 및 활동 지역 정보
   */
  @Patch('profile/:workerProfileId')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '워커 프로필 업데이트',
    description:
      '워커의 전문 분야와 활동 지역을 다중 선택하여 업데이트합니다. 기존 데이터는 삭제 후 새로운 데이터로 재삽입됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 업데이트 성공',
    schema: {
      example: {
        workerProfileId: 'uuid',
        fields: [{ fieldCode: 'FLD_TILE' }, { fieldCode: 'FLD_PAINTING' }],
        areas: [{ areaCode: 'AREA_SEOUL_GN' }, { areaCode: 'AREA_SEOUL_SC' }],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '요청 데이터 검증 실패 또는 워커 프로필 없음',
  })
  async updateProfile(
    @Param('workerProfileId') workerProfileId: string,
    @Body(new ZodValidationPipe(UpdateWorkerProfileBodySchema))
    updateDto: UpdateWorkerProfileBodyDto,
  ) {
    this.logger.info({ workerProfileId }, '워커 프로필 업데이트 요청 수신');

    return await this.profileService.updateWorkerProfile(
      workerProfileId,
      updateDto,
    );
  }

  /**
   * 워커 프로필 핵심 정보 수정
   *
   * businessName, description, 사무실 주소 등을 부분 업데이트합니다.
   *
   * @param workerProfileId 워커 프로필 ID
   * @param updateDto 수정할 필드 (부분 업데이트 허용)
   * @returns 업데이트된 워커 프로필 정보
   */
  @Patch('profile/:workerProfileId/info')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '워커 프로필 핵심 정보 수정',
    description:
      '사업명, 자기소개, 경력, 사무실 정보 등을 부분 업데이트합니다. 제공된 필드만 업데이트됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 정보 수정 성공',
  })
  @ApiResponse({
    status: 400,
    description: '요청 데이터 검증 실패',
  })
  @ApiResponse({
    status: 404,
    description: '워커 프로필을 찾을 수 없음',
  })
  async updateProfileInfo(
    @Param('workerProfileId') workerProfileId: string,
    @Body(new ZodValidationPipe(UpdateWorkerProfileInfoSchema))
    updateDto: UpdateWorkerProfileInfoDto,
  ) {
    this.logger.info({ workerProfileId }, '워커 프로필 핵심 정보 수정 요청');
    return await this.profileService.updateWorkerProfileInfo(
      workerProfileId,
      updateDto,
    );
  }

  /**
   * 내 워커 프로필 조회
   *
   * JWT 토큰 기반으로 현재 로그인한 사용자의 워커 프로필을 조회합니다.
   * 온보딩 완료 여부 확인에 사용됩니다.
   *
   * @param user JWT에서 추출된 사용자 정보
   * @returns 워커 프로필 (fields, areas 포함) 또는 null
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '내 워커 프로필 조회',
    description:
      '현재 로그인한 사용자의 워커 프로필을 조회합니다. 프로필이 없으면 null 반환.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공 (null 가능)',
  })
  async getMyProfile(@CurrentUser() user: UserPayload) {
    this.logger.debug({ userId: user.id }, '내 워커 프로필 조회 요청');
    return await this.profileService.getMyWorkerProfile(user.id);
  }

  /**
   * 온보딩 완료
   *
   * 워커 프로필을 생성 또는 업데이트합니다.
   * slug, businessName, fieldCodes는 필수이며, areaCodes와 경력 정보는 선택사항입니다.
   *
   * @param user JWT에서 추출된 사용자 정보
   * @param dto 온보딩 완료 데이터
   * @returns 업데이트된 워커 프로필 정보
   */
  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '온보딩 완료',
    description:
      '워커 프로필을 생성 또는 업데이트합니다. slug, businessName, fieldCodes 필수.',
  })
  @ApiResponse({
    status: 200,
    description: '온보딩 완료 성공',
  })
  @ApiResponse({
    status: 409,
    description: '이미 사용 중인 slug',
  })
  async completeOnboarding(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(CompleteOnboardingSchema))
    dto: CompleteOnboardingDto,
  ) {
    this.logger.info(
      { userId: user.id, slug: dto.slug },
      '온보딩 완료 요청 수신',
    );
    return await this.profileService.completeOnboarding(user.id, dto);
  }

  /**
   * 워커 프로필 정보 조회
   *
   * 특정 워커의 프로필, 전문 분야, 활동 지역 정보를 조회합니다.
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 워커 프로필 정보 (필드 및 지역 포함)
   */
  @Get('profile/:workerProfileId')
  @Public()
  @ApiOperation({
    summary: '워커 프로필 조회',
    description: '워커의 프로필, 전문 분야, 활동 지역 정보를 함께 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '워커 프로필을 찾을 수 없음',
  })
  async getProfile(@Param('workerProfileId') workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 프로필 조회 요청');

    const profile =
      await this.profileService.getWorkerProfileInfo(workerProfileId);

    if (!profile) {
      throw new NotFoundException('워커 프로필을 찾을 수 없습니다');
    }

    return profile;
  }
}
