import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PinoLogger } from 'nestjs-pino';
import { PublicService } from '../services/public.service';
import { Public } from '@/common/decorators/public.decorator';

/**
 * Public Controller
 *
 * 토큰 없이 누구나 접근 가능한 공개 API 엔드포인트를 제공합니다.
 * - 공개 프로필 조회 (GET /public/profiles/:slug)
 * - 포트폴리오 정보 공개 조회
 */
@Controller('public/profiles')
@ApiTags('Public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(PublicController.name);
    }
  }

  /**
   * 공개 프로필 조회 (Slug 기반)
   *
   * 토큰 없이 누구나 접근 가능한 공개 프로필 조회 엔드포인트입니다.
   * 해당 슬러그의 워커 프로필, 전문 분야, 활동 지역, 포트폴리오 정보를 모두 반환합니다.
   *
   * 포트폴리오 공개 여부는 costVisibility 필드로 제어됩니다:
   * - PUBLIC: 누구나 볼 수 있음
   * - PRIVATE: 워커만 볼 수 있음 (공개 조회에서도 반환됨, 프론트에서 필터링)
   *
   * @param slug 워커의 프로필 슬러그 (예: kim-tile-expert)
   * @returns 워커 프로필, 전문 분야, 활동 지역, 포트폴리오 정보
   */
  /**
   * 플랫폼 통계 조회 (소셜 프루프용)
   *
   * 랜딩 히어로 섹션에서 워커 수 소셜 프루프 표시용.
   */
  @Get('stats')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '플랫폼 통계 조회',
    description:
      '워커 수 등 공개 통계를 반환합니다. 랜딩 페이지 소셜 프루프용.',
  })
  @ApiResponse({
    status: 200,
    description: '통계 조회 성공',
    schema: { example: { workerCount: 42 } },
  })
  async getStats() {
    return this.publicService.getStats();
  }

  /**
   * 최신 포트폴리오 목록 조회 (랜딩 마퀴용)
   */
  @Get('portfolios')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '최신 포트폴리오 목록 조회',
    description:
      '랜딩 페이지 마퀴(PortfolioStrip)에 표시할 최신 포트폴리오 목록을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 목록 조회 성공',
  })
  async getLatestPortfolios() {
    return this.publicService.getLatestPortfolios(8);
  }

  /**
   * Slug 사용 가능 여부 확인
   *
   * 예약어 + DB 중복을 체크합니다. 조회수 증가 없음.
   */
  @Get('slug-check')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 60 } }) // 실시간 debounce 허용 (기본 10req/60s는 5초 타이핑 후 429)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Slug 사용 가능 여부 확인',
    description:
      '예약어 체크 + DB 중복 체크를 수행합니다. 조회수 증가 없음. 온보딩 slug 입력 시 실시간 체크용.',
  })
  @ApiResponse({
    status: 200,
    description: 'Slug 체크 결과',
    schema: {
      example: { available: true },
    },
  })
  async checkSlug(@Query('slug') slug: string) {
    this.logger.info({ slug }, 'Slug 사용 가능 여부 확인 요청');
    return this.publicService.checkSlugAvailability(slug ?? '');
  }

  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '공개 워커 프로필 조회',
    description:
      '토큰 없이 접근 가능한 공개 프로필 조회입니다. 워커의 프로필, 전문 분야, 활동 지역, 포트폴리오 정보를 반환합니다. (slug.bluecollar.cv)',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
      example: {
        profile: {
          id: 'uuid',
          slug: 'kim-tile-expert',
          businessName: '김타일 전문공사',
          profileImageUrl: 'https://...',
          description: '15년 경력의 타일 전문가입니다.',
          businessVerified: true,
          officeAddress: '서울 강남구 삼성동 123',
          officeCity: '서울',
          officeDistrict: '강남구',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        user: {
          id: 'uuid',
          phoneNumber: '01012345678',
          realName: '김철수',
          role: 'WORKER',
        },
        fields: [{ fieldCode: 'FLD_TILE' }, { fieldCode: 'FLD_PAINTING' }],
        areas: [{ areaCode: 'AREA_SEOUL_GN' }, { areaCode: 'AREA_SEOUL_SC' }],
        portfolios: [
          {
            id: 'uuid',
            title: '강남 아파트 타일 공사',
            content: '상세 설명...',
            difficulty: 'MEDIUM',
            costVisibility: 'PRIVATE',
            media: [
              {
                id: 'uuid',
                mediaUrl: 'https://...',
                mediaType: 'IMAGE',
                imageType: 'BEFORE',
                displayOrder: 1,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '프로필을 찾을 수 없음',
  })
  async getPublicProfile(@Param('slug') slug: string) {
    this.logger.info({ slug }, '공개 프로필 조회 요청 수신');

    const profile = await this.publicService.getPublicProfile(slug);

    // 포트폴리오 조회수 증가 (비동기로 실행, 응답을 기다리지 않음)
    if (profile.portfolios && profile.portfolios.length > 0) {
      profile.portfolios.forEach((portfolio: any) => {
        this.publicService
          .incrementPortfolioViewCount(portfolio.id)
          .catch((error) => {
            this.logger.warn(
              { portfolioId: portfolio.id, error },
              '조회수 증가 실패',
            );
          });
      });
    }

    return profile;
  }
}
