import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import { portfolios, portfolioMedia, workerProfiles } from '@repo/database';
import { CreatePortfolioDto } from '../dtos/create-portfolio.dto';
import { UpdatePortfolioDto } from '../dtos/update-portfolio.dto';
import { eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(PortfolioService.name);
    }
  }

  /**
   * 포트폴리오 생성
   *
   * 다음 단계를 트랜잭션으로 처리:
   * 1. 워커 프로필 존재 여부 확인
   * 2. portfolios 테이블에 포트폴리오 생성
   * 3. portfolio_media 테이블에 미디어 배열 저장 (displayOrder 자동 부여)
   *
   * @param createPortfolioDto 포트폴리오 생성 요청 데이터
   * @returns 생성된 포트폴리오 및 미디어 정보
   * @throws BadRequestException - 워커 프로필 없음 또는 유효하지 않은 입력
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto) {
    const {
      workerProfileId,
      title,
      content,
      startDate,
      endDate,
      difficulty,
      estimatedCost,
      actualCost,
      costVisibility,
      buildingId,
      media,
    } = createPortfolioDto;

    this.logger.info(
      { workerProfileId, title },
      '포트폴리오 생성 프로세스 시작',
    );

    // 트랜잭션으로 모든 작업을 원자적(atomic)으로 처리
    return await this.db.transaction(async (tx) => {
      try {
        // Step 1: 워커 프로필 존재 여부 확인
        this.logger.debug({ workerProfileId }, '워커 프로필 확인 중');
        const workerProfile = await tx
          .select()
          .from(workerProfiles)
          .where(eq(workerProfiles.id, workerProfileId))
          .limit(1);

        if (!workerProfile || workerProfile.length === 0) {
          this.logger.warn({ workerProfileId }, '워커 프로필을 찾을 수 없음');
          throw new BadRequestException('유효하지 않은 워커 프로필 ID입니다');
        }

        // Step 2: portfolios 테이블에 포트폴리오 생성
        this.logger.debug({ title }, '포트폴리오 레코드 생성 중');

        // 필수 필드만 기본으로 설정, 선택사항은 조건부로 추가
        const portfolioValues: any = {
          workerProfileId,
          title,
          content,
          costVisibility: costVisibility || 'PRIVATE',
        };

        // 선택사항 필드는 값이 있을 때만 추가
        if (startDate) {
          portfolioValues.startDate = new Date(startDate);
        }
        if (endDate) {
          portfolioValues.endDate = new Date(endDate);
        }
        if (difficulty) {
          portfolioValues.difficulty = difficulty;
        }
        if (estimatedCost) {
          portfolioValues.estimatedCost = estimatedCost.toString();
        }
        if (actualCost) {
          portfolioValues.actualCost = actualCost.toString();
        }
        if (buildingId) {
          portfolioValues.buildingId = buildingId;
        }

        const [newPortfolio] = await tx
          .insert(portfolios)
          .values(portfolioValues)
          .returning();

        const portfolioId = newPortfolio.id;
        this.logger.info({ portfolioId, title }, '포트폴리오 생성 완료');

        // Step 3: portfolio_media 테이블에 미디어 배열 저장
        // displayOrder는 배열 순서를 1부터 시작하여 자동 부여
        if (media && media.length > 0) {
          this.logger.debug(
            { count: media.length },
            '포트폴리오 미디어 저장 중',
          );

          const mediaRecords = media.map((mediaItem, index) => {
            const record: any = {
              portfolioId,
              mediaUrl: mediaItem.mediaUrl,
              mediaType: mediaItem.mediaType,
              // displayOrder는 배열의 인덱스를 기반으로 1부터 시작
              displayOrder: index + 1,
            };

            // 선택사항 필드는 조건부로 추가
            if (mediaItem.imageType) {
              record.imageType = mediaItem.imageType;
            }
            if (mediaItem.videoDuration) {
              record.videoDuration = mediaItem.videoDuration;
            }
            if (mediaItem.thumbnailUrl) {
              record.thumbnailUrl = mediaItem.thumbnailUrl;
            }
            if (mediaItem.description) {
              record.description = mediaItem.description;
            }

            return record;
          });

          await tx.insert(portfolioMedia).values(mediaRecords);

          this.logger.info(
            { portfolioId, mediaCount: media.length },
            '포트폴리오 미디어 저장 완료',
          );
        }

        // 생성된 포트폴리오 반환 (미디어 정보 포함)
        const savedMedia = await tx
          .select()
          .from(portfolioMedia)
          .where(eq(portfolioMedia.portfolioId, portfolioId));

        this.logger.info({ portfolioId }, '포트폴리오 생성 프로세스 완료');

        return {
          id: newPortfolio.id,
          title: newPortfolio.title,
          content: newPortfolio.content,
          workerProfileId: newPortfolio.workerProfileId,
          startDate: newPortfolio.startDate,
          endDate: newPortfolio.endDate,
          difficulty: newPortfolio.difficulty,
          costVisibility: newPortfolio.costVisibility,
          media: savedMedia.map((m) => ({
            id: m.id,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            imageType: m.imageType,
            displayOrder: m.displayOrder,
            description: m.description,
          })),
        };
      } catch (error) {
        // 에러 발생 시 Transaction이 자동으로 rollback됨
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          { error: errorMessage, stack: errorStack },
          '포트폴리오 생성 실패',
        );
        throw error;
      }
    });
  }

  /**
   * 포트폴리오 수정
   *
   * 다음 단계를 트랜잭션으로 처리:
   * 1. 포트폴리오 존재 여부 및 소유권 확인
   * 2. portfolios 테이블의 기본 정보 업데이트
   * 3. 미디어 제공 시 기존 미디어 삭제 후 재삽입
   *
   * @param portfolioId 포트폴리오 ID
   * @param workerProfileId 요청자의 워커 프로필 ID (소유권 검증용)
   * @param updateDto 수정 데이터
   * @returns 업데이트된 포트폴리오 정보
   * @throws NotFoundException - 포트폴리오 없음
   * @throws ForbiddenException - 다른 워커의 포트폴리오 수정 시도
   */
  async updatePortfolio(
    portfolioId: string,
    workerProfileId: string,
    updateDto: UpdatePortfolioDto,
  ) {
    this.logger.info({ portfolioId, workerProfileId }, '포트폴리오 수정 시작');

    return await this.db.transaction(async (tx) => {
      // Step 1: 포트폴리오 존재 여부 확인
      const existing = await tx
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1);

      if (!existing || existing.length === 0) {
        throw new NotFoundException('포트폴리오를 찾을 수 없습니다');
      }

      // Step 2: 소유권 검증 (ADMIN은 OwnershipGuard에서 통과하므로 여기선 WORKER만 체크)
      if (existing[0].workerProfileId !== workerProfileId) {
        throw new ForbiddenException('자신의 포트폴리오만 수정할 수 있습니다');
      }

      // Step 3: 기본 정보 업데이트 (제공된 필드만)
      const updateValues: Record<string, unknown> = {};
      if (updateDto.title !== undefined) updateValues.title = updateDto.title;
      if (updateDto.content !== undefined)
        updateValues.content = updateDto.content;
      if (updateDto.startDate !== undefined)
        updateValues.startDate = updateDto.startDate;
      if (updateDto.endDate !== undefined)
        updateValues.endDate = updateDto.endDate;
      if (updateDto.difficulty !== undefined)
        updateValues.difficulty = updateDto.difficulty;
      if (updateDto.estimatedCost !== undefined)
        updateValues.estimatedCost = updateDto.estimatedCost.toString();
      if (updateDto.actualCost !== undefined)
        updateValues.actualCost = updateDto.actualCost.toString();
      if (updateDto.costVisibility !== undefined)
        updateValues.costVisibility = updateDto.costVisibility;
      if (updateDto.buildingId !== undefined)
        updateValues.buildingId = updateDto.buildingId;

      updateValues.updatedAt = new Date();

      const [updated] = await tx
        .update(portfolios)
        .set(updateValues)
        .where(eq(portfolios.id, portfolioId))
        .returning();

      // Step 4: 미디어 업데이트 (제공 시 기존 미디어 전체 교체)
      if (updateDto.media !== undefined) {
        this.logger.debug(
          { portfolioId, mediaCount: updateDto.media.length },
          '포트폴리오 미디어 교체 중',
        );

        // 기존 미디어 삭제
        await tx
          .delete(portfolioMedia)
          .where(eq(portfolioMedia.portfolioId, portfolioId));

        // 새 미디어 삽입
        const mediaRecords = updateDto.media.map((item, index) => {
          const record: any = {
            portfolioId,
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            displayOrder: index + 1,
          };
          if (item.imageType) record.imageType = item.imageType;
          if (item.videoDuration) record.videoDuration = item.videoDuration;
          if (item.thumbnailUrl) record.thumbnailUrl = item.thumbnailUrl;
          if (item.description) record.description = item.description;
          return record;
        });

        await tx.insert(portfolioMedia).values(mediaRecords);
      }

      // 최종 미디어 조회
      const savedMedia = await tx
        .select()
        .from(portfolioMedia)
        .where(eq(portfolioMedia.portfolioId, portfolioId));

      this.logger.info({ portfolioId }, '포트폴리오 수정 완료');

      return {
        ...updated,
        media: savedMedia.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          imageType: m.imageType,
          displayOrder: m.displayOrder,
          description: m.description,
        })),
      };
    });
  }

  /**
   * 포트폴리오 삭제
   *
   * @param portfolioId 포트폴리오 ID
   * @param workerProfileId 요청자의 워커 프로필 ID (소유권 검증용)
   * @throws NotFoundException - 포트폴리오 없음
   * @throws ForbiddenException - 다른 워커의 포트폴리오 삭제 시도
   */
  async deletePortfolio(
    portfolioId: string,
    workerProfileId: string,
  ): Promise<void> {
    this.logger.info({ portfolioId, workerProfileId }, '포트폴리오 삭제 시작');

    // 포트폴리오 존재 여부 및 소유권 확인
    const existing = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!existing || existing.length === 0) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다');
    }

    if (existing[0].workerProfileId !== workerProfileId) {
      throw new ForbiddenException('자신의 포트폴리오만 삭제할 수 있습니다');
    }

    // cascade 설정으로 portfolioMedia도 함께 삭제됨
    await this.db.delete(portfolios).where(eq(portfolios.id, portfolioId));

    this.logger.info({ portfolioId }, '포트폴리오 삭제 완료');
  }

  /**
   * 포트폴리오 조회 (ID 기반)
   *
   * @param portfolioId 포트폴리오 ID
   * @returns 포트폴리오 상세 정보 (미디어 포함)
   */
  async getPortfolioById(portfolioId: string) {
    this.logger.debug({ portfolioId }, '포트폴리오 조회 중');

    const portfolio = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio || portfolio.length === 0) {
      this.logger.warn({ portfolioId }, '포트폴리오를 찾을 수 없음');
      return null;
    }

    // 포트폴리오 미디어 조회 (displayOrder 순서대로)
    const media = await this.db
      .select()
      .from(portfolioMedia)
      .where(eq(portfolioMedia.portfolioId, portfolioId))
      .orderBy((t) => t.displayOrder);

    return {
      ...portfolio[0],
      media,
    };
  }

  /**
   * 워커의 모든 포트폴리오 조회
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 포트폴리오 배열 (미디어 포함)
   */
  async getPortfoliosByWorker(workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 포트폴리오 목록 조회 중');

    const workerPortfolios = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.workerProfileId, workerProfileId))
      .orderBy((t) => t.createdAt);

    // 모든 포트폴리오의 미디어를 한 번에 조회 (N+1 쿼리 방지)
    const portfolioIds = workerPortfolios.map((p) => p.id);
    let allMedia: any[] = [];

    if (portfolioIds.length > 0) {
      allMedia = await this.db
        .select()
        .from(portfolioMedia)
        .where(inArray(portfolioMedia.portfolioId, portfolioIds))
        .orderBy((t) => t.displayOrder);
    }

    // 메모리에서 포트폴리오별로 미디어 그룹핑
    const mediaByPortfolio = new Map<string, typeof allMedia>();
    allMedia.forEach((media) => {
      if (!mediaByPortfolio.has(media.portfolioId)) {
        mediaByPortfolio.set(media.portfolioId, []);
      }
      mediaByPortfolio.get(media.portfolioId)!.push(media);
    });

    const portfoliosWithMedia = workerPortfolios.map((portfolio) => ({
      ...portfolio,
      media: mediaByPortfolio.get(portfolio.id) || [],
    }));

    this.logger.info(
      { workerProfileId, count: portfoliosWithMedia.length },
      '워커 포트폴리오 목록 조회 완료',
    );

    return portfoliosWithMedia;
  }
}
