import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { CodesService } from '../services/codes.service';
import { Public } from '@/common/decorators/public.decorator';

/**
 * Codes Controller
 *
 * 토큰 없이 누구나 접근 가능한 마스터 코드 조회 API입니다.
 * - 그룹별 코드 조회 (GET /codes?group=FIELD)
 * - 업종별 스킬 태그 조회 (GET /codes/skill-tags?fieldCode=FLD_TILE)
 * - 온보딩용 코드 일괄 조회 (GET /codes/onboarding)
 */
@Controller('codes')
@ApiTags('Codes')
export class CodesController {
  constructor(
    private readonly codesService: CodesService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(CodesController.name);
    }
  }

  /**
   * 그룹별 마스터 코드 조회
   *
   * group 파라미터에 따라 해당 그룹의 코드 목록을 반환합니다.
   * - FIELD: 업종 목록
   * - EXP: 숙련도 목록
   * - BIZ: 사업자 유형 목록
   * - AREA: 지역 목록
   * - SKILL_TAG_FLD_TILE: 타일 업종 기술 태그 목록
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '그룹별 마스터 코드 조회',
    description:
      'group 파라미터에 해당하는 마스터 코드 목록을 반환합니다. FIELD, EXP, BIZ, AREA, SKILL_TAG_FLD_XXX 등을 지원합니다.',
  })
  @ApiQuery({
    name: 'group',
    required: true,
    description: '코드 그룹 (예: FIELD, EXP, BIZ, AREA, SKILL_TAG_FLD_TILE)',
    example: 'FIELD',
  })
  @ApiResponse({
    status: 200,
    description: '코드 목록 조회 성공',
    schema: {
      example: [
        { code: 'FLD_TILE', group: 'FIELD', name: '타일', sortOrder: 9 },
        { code: 'FLD_WALLPAPER', group: 'FIELD', name: '도배', sortOrder: 10 },
      ],
    },
  })
  async findByGroup(@Query('group') group: string) {
    this.logger.info({ group }, '마스터 코드 조회 요청');
    return this.codesService.findByGroup(group);
  }

  /**
   * 업종별 스킬 태그 조회
   *
   * 특정 업종 코드에 속하는 기술 태그 목록을 반환합니다.
   * 예: fieldCode=FLD_TILE → SKILL_TAG_FLD_TILE 그룹의 태그 반환
   */
  @Get('skill-tags')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '업종별 스킬 태그 조회',
    description:
      '업종 코드(fieldCode)에 해당하는 기술 태그 목록을 반환합니다. 예: FLD_TILE → 타일 관련 태그 목록',
  })
  @ApiQuery({
    name: 'fieldCode',
    required: true,
    description: '업종 코드 (예: FLD_TILE, FLD_ELECTRIC)',
    example: 'FLD_TILE',
  })
  @ApiResponse({
    status: 200,
    description: '스킬 태그 목록 조회 성공',
    schema: {
      example: [
        {
          code: 'TAG_TILE_BATHROOM',
          group: 'SKILL_TAG_FLD_TILE',
          name: '욕실 타일',
          sortOrder: 1,
        },
        {
          code: 'TAG_TILE_KITCHEN',
          group: 'SKILL_TAG_FLD_TILE',
          name: '주방 타일',
          sortOrder: 2,
        },
      ],
    },
  })
  async findSkillTags(@Query('fieldCode') fieldCode: string) {
    this.logger.info({ fieldCode }, '스킬 태그 조회 요청');
    return this.codesService.findSkillTagsByField(fieldCode);
  }

  /**
   * 온보딩용 코드 일괄 조회
   *
   * 워커 온보딩에 필요한 FIELD, EXP, BIZ 코드를 한 번에 반환합니다.
   */
  @Get('onboarding')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '온보딩용 코드 일괄 조회',
    description:
      '워커 온보딩에 필요한 업종(FIELD), 숙련도(EXP), 사업자 유형(BIZ) 코드를 한 번에 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '온보딩 코드 조회 성공',
    schema: {
      example: {
        fields: [
          { code: 'FLD_TILE', group: 'FIELD', name: '타일', sortOrder: 9 },
        ],
        expLevels: [
          { code: 'EXP_1TO3', group: 'EXP', name: '1~3년', sortOrder: 1 },
        ],
        bizTypes: [
          { code: 'BIZ_INDIVIDUAL', group: 'BIZ', name: '개인', sortOrder: 1 },
        ],
      },
    },
  })
  async findOnboardingCodes() {
    this.logger.info('온보딩 코드 조회 요청');
    return this.codesService.findOnboardingCodes();
  }
}
