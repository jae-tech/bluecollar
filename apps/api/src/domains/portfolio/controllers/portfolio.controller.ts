import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { PinoLogger } from 'nestjs-pino';
import { PortfolioService } from '../services/portfolio.service';
import { Public } from '@/common/decorators/public.decorator';
import { OwnershipGuard } from '@/common/guards/ownership.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@/common/types/user.types';
import {
  CreatePortfolioDto,
  CreatePortfolioSchema,
} from '../dtos/create-portfolio.dto';
import {
  UpdatePortfolioDto,
  UpdatePortfolioSchema,
} from '../dtos/update-portfolio.dto';

/**
 * Portfolio Controller
 *
 * 워커의 포트폴리오(시공 사례) 관리 API 엔드포인트를 제공합니다.
 * - 포트폴리오 생성 (POST /portfolios)
 * - 포트폴리오 수정 (PATCH /portfolios/:id)
 * - 포트폴리오 삭제 (DELETE /portfolios/:id)
 * - 포트폴리오 상세 조회 (GET /portfolios/:id)
 * - 워커의 모든 포트폴리오 조회 (GET /portfolios/worker/:workerProfileId)
 */
@Controller('portfolios')
@ApiTags('Portfolio')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(PortfolioController.name);
    }
  }

  /**
   * 포트폴리오 생성
   *
   * 워커가 시공 사례를 포트폴리오로 등록합니다.
   * - JWT 토큰의 workerProfileId와 요청의 workerProfileId가 일치해야 함
   *
   * @param createPortfolioDto 포트폴리오 생성 요청 데이터
   * @returns 생성된 포트폴리오 정보 (ID, 제목, 미디어 포함)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '포트폴리오 생성',
    description:
      '워커가 새로운 포트폴리오(시공 사례)를 등록합니다. 이미지, 비디오, PDF 등의 미디어를 함께 저장할 수 있습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '포트폴리오 생성 성공',
    schema: {
      example: {
        id: 'uuid',
        title: '강남 아파트 타일 공사',
        content: '상세 설명...',
        workerProfileId: 'uuid',
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
    },
  })
  @ApiResponse({ status: 400, description: '요청 데이터 검증 실패' })
  @ApiResponse({
    status: 403,
    description: '다른 워커 프로필로 포트폴리오 생성 시도',
  })
  async createPortfolio(
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(CreatePortfolioSchema))
    createPortfolioDto: CreatePortfolioDto,
  ) {
    // JWT에서 workerProfileId 파생 — IDOR 방지 (DTO의 workerProfileId 무시)
    const workerProfileId = user.workerProfileId;

    if (!workerProfileId) {
      throw new ForbiddenException(
        '워커 프로필이 없습니다. 온보딩을 완료해주세요',
      );
    }

    this.logger.info({ workerProfileId }, '포트폴리오 생성 요청 수신');

    return await this.portfolioService.createPortfolio(
      createPortfolioDto,
      workerProfileId,
    );
  }

  /**
   * 포트폴리오 수정
   *
   * 워커가 자신의 포트폴리오를 수정합니다.
   * - 제공된 필드만 업데이트 (partial update)
   * - 미디어 제공 시 기존 미디어 전체 교체
   *
   * @param id 포트폴리오 ID
   * @param user 현재 로그인한 사용자 정보
   * @param updateDto 수정 요청 데이터
   * @returns 수정된 포트폴리오 정보
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '포트폴리오 수정',
    description:
      '포트폴리오 정보를 부분 업데이트합니다. 미디어를 제공하면 기존 미디어가 모두 교체됩니다.',
  })
  @ApiResponse({ status: 200, description: '포트폴리오 수정 성공' })
  @ApiResponse({ status: 400, description: '요청 데이터 검증 실패' })
  @ApiResponse({ status: 403, description: '다른 워커의 포트폴리오 수정 시도' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async updatePortfolio(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body(new ZodValidationPipe(UpdatePortfolioSchema))
    updateDto: UpdatePortfolioDto,
  ) {
    this.logger.info(
      { portfolioId: id, userId: user.id },
      '포트폴리오 수정 요청 수신',
    );

    return await this.portfolioService.updatePortfolio(
      id,
      user.workerProfileId ?? '',
      updateDto,
    );
  }

  /**
   * 포트폴리오 삭제
   *
   * 워커가 자신의 포트폴리오를 삭제합니다.
   * - 연관된 미디어도 함께 삭제됨 (cascade)
   *
   * @param id 포트폴리오 ID
   * @param user 현재 로그인한 사용자 정보
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '포트폴리오 삭제',
    description: '포트폴리오와 연관된 미디어를 모두 삭제합니다.',
  })
  @ApiResponse({ status: 204, description: '포트폴리오 삭제 성공' })
  @ApiResponse({ status: 403, description: '다른 워커의 포트폴리오 삭제 시도' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async deletePortfolio(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.logger.info(
      { portfolioId: id, userId: user.id },
      '포트폴리오 삭제 요청 수신',
    );

    await this.portfolioService.deletePortfolio(id, user.workerProfileId ?? '');
  }

  /**
   * 포트폴리오 상세 조회
   *
   * 특정 포트폴리오의 상세 정보와 모든 미디어를 조회합니다.
   *
   * @param id 포트폴리오 ID
   * @returns 포트폴리오 상세 정보 (미디어 포함)
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: '포트폴리오 상세 조회',
    description: '특정 포트폴리오의 상세 정보와 미디어를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '포트폴리오 조회 성공' })
  @ApiResponse({ status: 404, description: '포트폴리오를 찾을 수 없음' })
  async getPortfolio(@Param('id') id: string) {
    this.logger.debug({ portfolioId: id }, '포트폴리오 상세 조회 요청');

    const portfolio = await this.portfolioService.getPortfolioById(id);

    if (!portfolio) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다');
    }

    return portfolio;
  }

  /**
   * 워커의 모든 포트폴리오 조회
   *
   * 특정 워커가 등록한 모든 포트폴리오를 조회합니다.
   * 최신 순서로 정렬됩니다.
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 포트폴리오 배열 (각 포트폴리오마다 미디어 포함)
   */
  @Get('worker/:workerProfileId')
  @Public()
  @ApiOperation({
    summary: '워커 포트폴리오 목록 조회',
    description: '특정 워커가 등록한 모든 포트폴리오를 조회합니다 (최신순).',
  })
  @ApiResponse({ status: 200, description: '포트폴리오 목록 조회 성공' })
  async getWorkerPortfolios(@Param('workerProfileId') workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 포트폴리오 목록 조회 요청');

    return await this.portfolioService.getPortfoliosByWorker(workerProfileId);
  }
}
