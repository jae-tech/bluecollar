import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import {
  portfolios,
  portfolioMedia,
  portfolioDetails,
  portfolioTags,
  portfolioRooms,
  materials,
  workerProfiles,
} from '@repo/database';
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
   * materialId 배열에 대한 사전 유효성 검증
   *
   * 존재하지 않는 materialId가 포함되어 있으면 BadRequestException을 던진다.
   * FK 에러를 잡는 것보다 명확한 에러 메시지 제공이 가능하다.
   *
   * @param tx Drizzle 트랜잭션 컨텍스트
   * @param materialIds 검증할 materialId 배열
   */
  private async validateMaterialIds(
    tx: PostgresJsDatabase<typeof schema>,
    materialIds: string[],
  ): Promise<void> {
    if (materialIds.length === 0) return;

    const found = await tx
      .select({ id: materials.id })
      .from(materials)
      .where(inArray(materials.id, materialIds));

    if (found.length !== materialIds.length) {
      const foundIds = new Set(found.map((r) => r.id));
      const missing = materialIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `존재하지 않는 자재 ID입니다: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * 포트폴리오 생성
   *
   * 다음 단계를 트랜잭션으로 처리:
   * 1. 워커 프로필 존재 여부 확인
   * 2. materialId 유효성 사전 검증
   * 3. portfolios 테이블에 포트폴리오 생성
   * 4. portfolioDetails INSERT (buildingAge, bathroomCount, bedroomCount 포함)
   * 5. portfolioRooms INSERT
   * 6. portfolioTags INSERT (객체 배열, materialId/roomId 바인딩)
   * 7. portfolioMedia INSERT (roomId 바인딩 포함)
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
      location,
      spaceType,
      constructionScope,
      details,
      rooms,
      tags,
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

        // Step 2: materialId 유효성 사전 검증 (존재 여부 SELECT로 확인)
        if (tags && tags.length > 0) {
          const materialIds = tags
            .map((t) => t.materialId)
            .filter((id): id is string => !!id);
          await this.validateMaterialIds(tx, materialIds);
        }

        // Step 3: portfolios 테이블에 포트폴리오 생성
        this.logger.debug({ title }, '포트폴리오 레코드 생성 중');

        const portfolioValues: any = {
          workerProfileId,
          title,
          content: content ?? null,
          costVisibility: costVisibility || 'PRIVATE',
        };

        if (location) portfolioValues.location = location;
        if (spaceType) portfolioValues.spaceType = spaceType;
        if (constructionScope)
          portfolioValues.constructionScope = constructionScope;
        if (startDate) portfolioValues.startDate = new Date(startDate);
        if (endDate) portfolioValues.endDate = new Date(endDate);
        if (difficulty) portfolioValues.difficulty = difficulty;
        if (estimatedCost)
          portfolioValues.estimatedCost = estimatedCost.toString();
        if (actualCost) portfolioValues.actualCost = actualCost.toString();
        if (buildingId) portfolioValues.buildingId = buildingId;

        const [newPortfolio] = await tx
          .insert(portfolios)
          .values(portfolioValues)
          .returning();

        const portfolioId = newPortfolio.id;
        this.logger.info({ portfolioId, title }, '포트폴리오 생성 완료');

        // Step 4: portfolioDetails INSERT
        if (details) {
          await tx.insert(portfolioDetails).values({
            portfolioId,
            area: details.area?.toString(),
            areaUnit: details.areaUnit,
            roomType: details.roomType,
            warrantyMonths: details.warrantyMonths,
            buildingAge: details.buildingAge,
            bathroomCount: details.bathroomCount,
            bedroomCount: details.bedroomCount,
          });
        }

        // Step 5: portfolioRooms INSERT — 삽입된 ID를 반환받아 media roomIndex 매핑에 사용
        let insertedRooms: { id: string }[] = [];
        if (rooms && rooms.length > 0) {
          insertedRooms = await tx
            .insert(portfolioRooms)
            .values(
              rooms.map((room, index) => ({
                portfolioId,
                roomType: room.roomType,
                roomLabel: room.roomLabel ?? null,
                displayOrder: room.displayOrder ?? index,
              })),
            )
            .returning({ id: portfolioRooms.id });
        }

        // Step 6: portfolioTags INSERT (객체 배열 — tagName + materialId? + roomId?)
        if (tags && tags.length > 0) {
          await tx.insert(portfolioTags).values(
            tags.map((tag, index) => ({
              portfolioId,
              tagName: tag.tagName,
              materialId: tag.materialId ?? null,
              roomId: tag.roomId ?? null,
              displayOrder: index + 1,
            })),
          );
        }

        // Step 7: portfolioMedia INSERT (roomId 바인딩 포함)
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
              displayOrder: index + 1,
            };

            if (mediaItem.imageType) record.imageType = mediaItem.imageType;
            if (mediaItem.videoDuration)
              record.videoDuration = mediaItem.videoDuration;
            if (mediaItem.thumbnailUrl)
              record.thumbnailUrl = mediaItem.thumbnailUrl;
            if (mediaItem.description)
              record.description = mediaItem.description;
            // roomIndex 우선: 삽입된 room ID로 변환. roomId는 레거시 직접 바인딩 지원용
            if (
              mediaItem.roomIndex !== undefined &&
              insertedRooms[mediaItem.roomIndex]
            ) {
              record.roomId = insertedRooms[mediaItem.roomIndex].id;
            } else if (mediaItem.roomId) {
              record.roomId = mediaItem.roomId;
            }

            return record;
          });

          await tx.insert(portfolioMedia).values(mediaRecords);

          this.logger.info(
            { portfolioId, mediaCount: media.length },
            '포트폴리오 미디어 저장 완료',
          );
        }

        // 생성된 데이터 조회 후 반환
        const [savedMedia, savedDetails, savedTags, savedRooms] =
          await Promise.all([
            tx
              .select()
              .from(portfolioMedia)
              .where(eq(portfolioMedia.portfolioId, portfolioId))
              .orderBy((t) => t.displayOrder),
            tx
              .select()
              .from(portfolioDetails)
              .where(eq(portfolioDetails.portfolioId, portfolioId))
              .limit(1),
            tx
              .select()
              .from(portfolioTags)
              .where(eq(portfolioTags.portfolioId, portfolioId))
              .orderBy((t) => t.displayOrder),
            tx
              .select()
              .from(portfolioRooms)
              .where(eq(portfolioRooms.portfolioId, portfolioId))
              .orderBy((t) => t.displayOrder),
          ]);

        this.logger.info({ portfolioId }, '포트폴리오 생성 프로세스 완료');

        return {
          id: newPortfolio.id,
          title: newPortfolio.title,
          content: newPortfolio.content,
          location: newPortfolio.location,
          spaceType: newPortfolio.spaceType,
          constructionScope: newPortfolio.constructionScope,
          workerProfileId: newPortfolio.workerProfileId,
          startDate: newPortfolio.startDate,
          endDate: newPortfolio.endDate,
          difficulty: newPortfolio.difficulty,
          costVisibility: newPortfolio.costVisibility,
          details: savedDetails.length > 0 ? savedDetails[0] : null,
          rooms: savedRooms,
          tags: savedTags.map((t) => ({
            tagName: t.tagName,
            materialId: t.materialId,
            roomId: t.roomId,
          })),
          media: savedMedia.map((m) => ({
            id: m.id,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            imageType: m.imageType,
            displayOrder: m.displayOrder,
            description: m.description,
            roomId: m.roomId,
          })),
        };
      } catch (error) {
        // HttpException 서브클래스(BadRequestException 등)는 그대로 전파
        if (error instanceof HttpException) throw error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          { error: errorMessage, stack: errorStack },
          '포트폴리오 생성 실패',
        );
        throw new Error('포트폴리오 저장 중 오류가 발생했습니다');
      }
    });
  }

  /**
   * 포트폴리오 수정
   *
   * 다음 단계를 트랜잭션으로 처리:
   * 1. 포트폴리오 존재 여부 및 소유권 확인
   * 2. portfolios 테이블의 기본 정보 업데이트
   * 3. portfolioDetails UPSERT (buildingAge, bathroomCount, bedroomCount 포함)
   * 4. portfolioRooms 교체 (제공 시 전체 삭제 후 재삽입)
   * 5. portfolioTags 교체 (객체 배열)
   * 6. 미디어 업데이트 (제공 시 기존 미디어 전체 교체, roomId 포함)
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

      // Step 3: materialId 유효성 사전 검증
      if (updateDto.tags && updateDto.tags.length > 0) {
        const materialIds = updateDto.tags
          .map((t) => t.materialId)
          .filter((id): id is string => !!id);
        await this.validateMaterialIds(tx, materialIds);
      }

      // Step 4: 기본 정보 업데이트 (제공된 필드만)
      const updateValues: Record<string, unknown> = {};
      if (updateDto.title !== undefined) updateValues.title = updateDto.title;
      if (updateDto.content !== undefined)
        updateValues.content = updateDto.content;
      if (updateDto.location !== undefined)
        updateValues.location = updateDto.location;
      if (updateDto.spaceType !== undefined)
        updateValues.spaceType = updateDto.spaceType;
      if (updateDto.constructionScope !== undefined)
        updateValues.constructionScope = updateDto.constructionScope;
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

      // Step 5: portfolioDetails UPSERT (UNIQUE constraint 기반)
      if (updateDto.details !== undefined) {
        const d = updateDto.details;
        await tx
          .insert(portfolioDetails)
          .values({
            portfolioId,
            area: d.area?.toString(),
            areaUnit: d.areaUnit,
            roomType: d.roomType,
            warrantyMonths: d.warrantyMonths,
            buildingAge: d.buildingAge,
            bathroomCount: d.bathroomCount,
            bedroomCount: d.bedroomCount,
          })
          .onConflictDoUpdate({
            target: portfolioDetails.portfolioId,
            set: {
              area: d.area?.toString(),
              areaUnit: d.areaUnit,
              roomType: d.roomType,
              warrantyMonths: d.warrantyMonths,
              buildingAge: d.buildingAge,
              bathroomCount: d.bathroomCount,
              bedroomCount: d.bedroomCount,
              updatedAt: new Date(),
            },
          });
      }

      // Step 6: rooms 교체 (undefined = 변경없음, [] = 전체삭제, [...] = 교체)
      if (updateDto.rooms !== undefined) {
        await tx
          .delete(portfolioRooms)
          .where(eq(portfolioRooms.portfolioId, portfolioId));
        if (updateDto.rooms.length > 0) {
          await tx.insert(portfolioRooms).values(
            updateDto.rooms.map((room, index) => ({
              portfolioId,
              roomType: room.roomType,
              roomLabel: room.roomLabel ?? null,
              displayOrder: room.displayOrder ?? index,
            })),
          );
        }
      }

      // Step 7: tags 교체 (undefined = 변경없음, [] = 전체삭제, [...] = 교체)
      if (updateDto.tags !== undefined) {
        await tx
          .delete(portfolioTags)
          .where(eq(portfolioTags.portfolioId, portfolioId));
        if (updateDto.tags.length > 0) {
          await tx.insert(portfolioTags).values(
            updateDto.tags.map((tag, index) => ({
              portfolioId,
              tagName: tag.tagName,
              materialId: tag.materialId ?? null,
              roomId: tag.roomId ?? null,
              displayOrder: index + 1,
            })),
          );
        }
      }

      // Step 8: 미디어 업데이트 (제공 시 기존 미디어 전체 교체)
      if (updateDto.media !== undefined) {
        this.logger.debug(
          { portfolioId, mediaCount: updateDto.media.length },
          '포트폴리오 미디어 교체 중',
        );

        await tx
          .delete(portfolioMedia)
          .where(eq(portfolioMedia.portfolioId, portfolioId));

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
          if (item.roomId) record.roomId = item.roomId;
          return record;
        });

        await tx.insert(portfolioMedia).values(mediaRecords);
      }

      // 최종 데이터 조회
      const [savedMedia, savedDetails, savedTags, savedRooms] =
        await Promise.all([
          tx
            .select()
            .from(portfolioMedia)
            .where(eq(portfolioMedia.portfolioId, portfolioId))
            .orderBy((t) => t.displayOrder),
          tx
            .select()
            .from(portfolioDetails)
            .where(eq(portfolioDetails.portfolioId, portfolioId))
            .limit(1),
          tx
            .select()
            .from(portfolioTags)
            .where(eq(portfolioTags.portfolioId, portfolioId))
            .orderBy((t) => t.displayOrder),
          tx
            .select()
            .from(portfolioRooms)
            .where(eq(portfolioRooms.portfolioId, portfolioId))
            .orderBy((t) => t.displayOrder),
        ]);

      this.logger.info({ portfolioId }, '포트폴리오 수정 완료');

      return {
        ...updated,
        details: savedDetails.length > 0 ? savedDetails[0] : null,
        rooms: savedRooms,
        tags: savedTags.map((t) => ({
          tagName: t.tagName,
          materialId: t.materialId,
          roomId: t.roomId,
        })),
        media: savedMedia.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          imageType: m.imageType,
          displayOrder: m.displayOrder,
          description: m.description,
          roomId: m.roomId,
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

    // cascade 설정으로 portfolioMedia, portfolioTags, portfolioRooms도 함께 삭제됨
    await this.db.delete(portfolios).where(eq(portfolios.id, portfolioId));

    this.logger.info({ portfolioId }, '포트폴리오 삭제 완료');
  }

  /**
   * 포트폴리오 조회 (ID 기반)
   *
   * @param portfolioId 포트폴리오 ID
   * @returns 포트폴리오 상세 정보 (미디어, 공간, 태그 포함)
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

    const p = portfolio[0];

    // 미디어, details, tags, rooms 한 번에 조회 (병렬 처리)
    const [media, detailsList, tagsList, roomsList] = await Promise.all([
      this.db
        .select()
        .from(portfolioMedia)
        .where(eq(portfolioMedia.portfolioId, portfolioId))
        .orderBy((t) => t.displayOrder),
      this.db
        .select()
        .from(portfolioDetails)
        .where(eq(portfolioDetails.portfolioId, portfolioId))
        .limit(1),
      this.db
        .select()
        .from(portfolioTags)
        .where(eq(portfolioTags.portfolioId, portfolioId))
        .orderBy((t) => t.displayOrder),
      this.db
        .select()
        .from(portfolioRooms)
        .where(eq(portfolioRooms.portfolioId, portfolioId))
        .orderBy((t) => t.displayOrder),
    ]);

    return {
      ...p,
      // SEC-1: costVisibility === 'PRIVATE'이면 actualCost 마스킹
      actualCost: p.costVisibility === 'PRIVATE' ? null : p.actualCost,
      details: detailsList.length > 0 ? detailsList[0] : null,
      rooms: roomsList,
      tags: tagsList.map((t) => ({
        tagName: t.tagName,
        materialId: t.materialId,
        roomId: t.roomId,
      })),
      media: media.map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        imageType: m.imageType,
        displayOrder: m.displayOrder,
        description: m.description,
        roomId: m.roomId,
      })),
    };
  }

  /**
   * 워커의 모든 포트폴리오 조회
   *
   * N+1 방지: 미디어와 공간(rooms) 모두 inArray로 배치 로드 후 메모리 그룹핑
   *
   * @param workerProfileId 워커 프로필 ID
   * @returns 포트폴리오 배열 (미디어, 공간 포함)
   */
  async getPortfoliosByWorker(workerProfileId: string) {
    this.logger.debug({ workerProfileId }, '워커 포트폴리오 목록 조회 중');

    const workerPortfolios = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.workerProfileId, workerProfileId))
      .orderBy((t) => t.createdAt);

    const portfolioIds = workerPortfolios.map((p) => p.id);

    if (portfolioIds.length === 0) {
      return [];
    }

    // 미디어 + 공간(rooms) 배치 로드 (N+1 방지)
    const [allMedia, allRooms] = await Promise.all([
      this.db
        .select()
        .from(portfolioMedia)
        .where(inArray(portfolioMedia.portfolioId, portfolioIds))
        .orderBy((t) => t.displayOrder),
      this.db
        .select()
        .from(portfolioRooms)
        .where(inArray(portfolioRooms.portfolioId, portfolioIds))
        .orderBy((t) => t.displayOrder),
    ]);

    // 메모리에서 포트폴리오별로 그룹핑
    const mediaByPortfolio = new Map<string, typeof allMedia>();
    allMedia.forEach((media) => {
      if (!mediaByPortfolio.has(media.portfolioId)) {
        mediaByPortfolio.set(media.portfolioId, []);
      }
      mediaByPortfolio.get(media.portfolioId)!.push(media);
    });

    const roomsByPortfolio = new Map<string, typeof allRooms>();
    allRooms.forEach((room) => {
      if (!roomsByPortfolio.has(room.portfolioId)) {
        roomsByPortfolio.set(room.portfolioId, []);
      }
      roomsByPortfolio.get(room.portfolioId)!.push(room);
    });

    const portfoliosWithData = workerPortfolios.map((portfolio) => ({
      ...portfolio,
      media: mediaByPortfolio.get(portfolio.id) || [],
      rooms: roomsByPortfolio.get(portfolio.id) || [],
    }));

    this.logger.info(
      { workerProfileId, count: portfoliosWithData.length },
      '워커 포트폴리오 목록 조회 완료',
    );

    return portfoliosWithData;
  }
}
