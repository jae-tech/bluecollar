import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
