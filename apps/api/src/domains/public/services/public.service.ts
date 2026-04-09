import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from '@/infrastructure/database/drizzle.module';
import {
  workerProfiles,
  workerFields,
  workerAreas,
  portfolios,
  portfolioMedia,
  portfolioDetails,
  portfolioTags,
  users,
} from '@repo/database';
import { validateSlug } from '@/common/validators/slug.validator';
import { eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

@Injectable()
export class PublicService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(PublicService.name);
    }
  }

  /**
   * 공개 프로필 조회 (Slug 기반)
   *
   * 다음 정보를 Join하여 반환:
   * - 워커 프로필 정보 (기본 정보)
   * - 사용자 정보 (phoneNumber, realName 등)
   * - 전문 분야 배열 (fieldCodes)
   * - 활동 지역 배열 (areaCodes)
   * - 포트폴리오 목록 (각 포트폴리오마다 미디어 포함)
   *
   * 토큰 없이 누구나 접근 가능합니다.
   *
   * @param slug 워커의 프로필 슬러그 (slug.bluecollar.cv의 slug 부분)
   * @returns 워커 프로필 및 포트폴리오 정보
   * @throws NotFoundException - 슬러그에 해당하는 프로필 없음
   */
  async getPublicProfile(slug: string) {
    this.logger.debug({ slug }, '공개 프로필 조회 중');

    // Step 1: 슬러그로 워커 프로필 조회
    const profiles = await this.db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.slug, slug))
      .limit(1);

    if (!profiles || profiles.length === 0) {
      this.logger.warn({ slug }, '프로필을 찾을 수 없음');
      throw new NotFoundException('해당 슬러그의 프로필을 찾을 수 없습니다');
    }

    const profile = profiles[0];
    const workerProfileId = profile.id;

    this.logger.info({ workerProfileId, slug }, '프로필 조회 완료');

    // Step 2: 사용자 정보 조회 (phoneNumber, realName, email 등)
    const userData = await this.db
      .select()
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1);

    // Step 3: 전문 분야 조회
    const fields = await this.db
      .select()
      .from(workerFields)
      .where(eq(workerFields.workerProfileId, workerProfileId));

    // Step 4: 활동 지역 조회
    const areas = await this.db
      .select()
      .from(workerAreas)
      .where(eq(workerAreas.workerProfileId, workerProfileId));

    // Step 5: 포트폴리오 목록 조회 (최신순, 공개 설정된 것만)
    const portfoliosList = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.workerProfileId, workerProfileId))
      .orderBy((t) => t.createdAt);

    // Step 6: 모든 포트폴리오의 미디어/details/tags를 한 번에 조회 (N+1 쿼리 최적화)
    const portfolioIds = portfoliosList.map((p) => p.id);
    let allMedia: any[] = [];
    let allDetails: any[] = [];
    let allTags: any[] = [];

    if (portfolioIds.length > 0) {
      [allMedia, allDetails, allTags] = await Promise.all([
        this.db
          .select()
          .from(portfolioMedia)
          .where(inArray(portfolioMedia.portfolioId, portfolioIds))
          .orderBy((t) => t.displayOrder),
        this.db
          .select()
          .from(portfolioDetails)
          .where(inArray(portfolioDetails.portfolioId, portfolioIds)),
        this.db
          .select()
          .from(portfolioTags)
          .where(inArray(portfolioTags.portfolioId, portfolioIds))
          .orderBy((t) => t.displayOrder),
      ]);
    }

    // Step 7: 메모리에서 포트폴리오별로 그룹핑
    const mediaByPortfolio = new Map<string, typeof allMedia>();
    allMedia.forEach((media) => {
      if (!mediaByPortfolio.has(media.portfolioId)) {
        mediaByPortfolio.set(media.portfolioId, []);
      }
      mediaByPortfolio.get(media.portfolioId)!.push(media);
    });

    const detailsByPortfolio = new Map<string, (typeof allDetails)[0]>();
    allDetails.forEach((d) => detailsByPortfolio.set(d.portfolioId, d));

    const tagsByPortfolio = new Map<string, string[]>();
    allTags.forEach((t) => {
      const arr = tagsByPortfolio.get(t.portfolioId) ?? [];
      arr.push(t.tagName);
      tagsByPortfolio.set(t.portfolioId, arr);
    });

    const portfoliosWithMedia = portfoliosList.map((portfolio) => ({
      ...portfolio,
      details: detailsByPortfolio.get(portfolio.id) ?? null,
      tags: tagsByPortfolio.get(portfolio.id) ?? [],
      media: mediaByPortfolio.get(portfolio.id) || [],
    }));

    this.logger.info(
      { workerProfileId, portfolioCount: portfoliosWithMedia.length },
      '공개 프로필 조회 완료',
    );

    // 최종 응답 구성
    return {
      // 워커 프로필 정보
      profile: {
        id: profile.id,
        slug: profile.slug,
        businessName: profile.businessName,
        profileImageUrl: profile.profileImageUrl,
        description: profile.description,
        careerSummary: profile.careerSummary,
        yearsOfExperience: profile.yearsOfExperience,
        businessVerified: profile.businessVerified,
        officeAddress: profile.officeAddress,
        officeCity: profile.officeCity,
        officeDistrict: profile.officeDistrict,
        officePhoneNumber: profile.officePhoneNumber,
        operatingHours: profile.operatingHours,
        officeImageUrl: profile.officeImageUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },

      // 사용자 정보 (개인 연락처 phoneNumber 제외 — 크롤링으로 수집 방지)
      user:
        userData && userData.length > 0
          ? {
              id: userData[0].id,
              realName: userData[0].realName,
              role: userData[0].role,
            }
          : null,

      // 전문 분야
      fields: fields.map((f) => ({
        fieldCode: f.fieldCode,
      })),

      // 활동 지역
      areas: areas.map((a) => ({
        areaCode: a.areaCode,
      })),

      // 포트폴리오 목록 (미디어/details/tags 포함)
      portfolios: portfoliosWithMedia.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        location: p.location,
        spaceType: p.spaceType,
        constructionScope: p.constructionScope,
        startDate: p.startDate,
        endDate: p.endDate,
        difficulty: p.difficulty,
        estimatedCost: p.estimatedCost,
        // SEC-1: costVisibility === 'PRIVATE'이면 actualCost 마스킹
        actualCost: p.costVisibility === 'PRIVATE' ? null : p.actualCost,
        costVisibility: p.costVisibility,
        viewCount: p.viewCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        details: p.details
          ? {
              area: p.details.area,
              areaUnit: p.details.areaUnit,
              roomType: p.details.roomType,
              warrantyMonths: p.details.warrantyMonths,
            }
          : null,
        tags: p.tags,
        media: p.media.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          imageType: m.imageType,
          videoDuration: m.videoDuration,
          thumbnailUrl: m.thumbnailUrl,
          displayOrder: m.displayOrder,
          description: m.description,
        })),
      })),
    };
  }

  /**
   * Slug 사용 가능 여부 확인
   *
   * 예약어 체크 + DB 중복 체크를 수행합니다.
   * 조회수 증가 없음 — 중복 확인 전용 엔드포인트입니다.
   *
   * @param slug 확인할 slug
   * @returns { available: boolean, reason?: string }
   */
  async checkSlugAvailability(
    slug: string,
  ): Promise<{ available: boolean; reason?: string }> {
    // 포맷 및 예약어 통합 검증 (validateSlug가 isSlugReserved도 포함)
    const validation = validateSlug(slug);
    if (!validation.valid) {
      return { available: false, reason: 'invalid_format' };
    }

    // DB 중복 체크
    const existing = await this.db
      .select({ id: workerProfiles.id })
      .from(workerProfiles)
      .where(eq(workerProfiles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return { available: false, reason: 'taken' };
    }

    return { available: true };
  }

  /**
   * 포트폴리오 조회수 증가 (공개 프로필 조회 시 호출)
   *
   * 포트폴리오 조회수(viewCount)를 1 증가시킵니다.
   * Atomic increment를 사용하여 race condition 방지
   *
   * @param portfolioId 포트폴리오 ID
   */
  async incrementPortfolioViewCount(portfolioId: string) {
    try {
      // Atomic increment: SELECT 없이 바로 UPDATE (race condition 방지)
      // PostgreSQL: UPDATE portfolios SET view_count = view_count + 1 WHERE id = ?
      await this.db
        .update(portfolios)
        .set({
          viewCount: sql`${portfolios.viewCount} + 1`,
        })
        .where(eq(portfolios.id, portfolioId));

      this.logger.debug({ portfolioId }, '포트폴리오 조회수 증가 완료');
    } catch (error) {
      // 조회수 증가 실패는 로그만 남기고 무시 (중요하지 않은 기능)
      this.logger.warn(
        { portfolioId, error: (error as Error).message },
        '포트폴리오 조회수 증가 실패',
      );
    }
  }
}
