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
  portfolioRooms,
  users,
} from '@repo/database';
import { validateSlug } from '@/common/validators/slug.validator';
import { eq, inArray, sql, desc, ilike, and, gte, lte, or } from 'drizzle-orm';
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
      .orderBy(desc(portfolios.createdAt));

    // Step 6: 모든 포트폴리오의 미디어/details/tags를 한 번에 조회 (N+1 쿼리 최적화)
    const portfolioIds = portfoliosList.map((p) => p.id);
    let allMedia: any[] = [];
    let allDetails: any[] = [];
    let allTags: any[] = [];

    let allRooms: any[] = [];

    if (portfolioIds.length > 0) {
      [allMedia, allDetails, allTags, allRooms] = await Promise.all([
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
        this.db
          .select()
          .from(portfolioRooms)
          .where(inArray(portfolioRooms.portfolioId, portfolioIds))
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

    const roomsByPortfolio = new Map<string, typeof allRooms>();
    allRooms.forEach((r) => {
      if (!roomsByPortfolio.has(r.portfolioId)) {
        roomsByPortfolio.set(r.portfolioId, []);
      }
      roomsByPortfolio.get(r.portfolioId)!.push(r);
    });

    const portfoliosWithMedia = portfoliosList.map((portfolio) => ({
      ...portfolio,
      details: detailsByPortfolio.get(portfolio.id) ?? null,
      tags: tagsByPortfolio.get(portfolio.id) ?? [],
      rooms: roomsByPortfolio.get(portfolio.id) ?? [],
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
        rooms: (p.rooms ?? []).map((r) => ({
          id: r.id,
          portfolioId: r.portfolioId,
          roomType: r.roomType,
          roomLabel: r.roomLabel,
          displayOrder: r.displayOrder,
        })),
        media: p.media.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          imageType: m.imageType,
          videoDuration: m.videoDuration,
          thumbnailUrl: m.thumbnailUrl,
          displayOrder: m.displayOrder,
          description: m.description,
          roomId: m.roomId ?? null,
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
   * 최신 포트폴리오 목록 조회 (랜딩 마퀴용)
   *
   * 최신 포트폴리오 중 대표 이미지가 있는 것 우선, 최대 limit개 반환.
   * 랜딩 페이지 PortfolioStrip에서 사용.
   *
   * @param limit 최대 반환 수 (기본 8)
   * @returns 포트폴리오 배열 (id, title, 대표 이미지 URL, 워커 이름)
   */
  async getLatestPortfolios(limit = 8): Promise<
    Array<{
      id: string;
      title: string;
      thumbnailUrl: string | null;
      workerName: string;
      category: string;
    }>
  > {
    // 최신 포트폴리오 + 워커 이름 조인
    const rows = await this.db
      .select({
        id: portfolios.id,
        title: portfolios.title,
        businessName: workerProfiles.businessName,
        spaceType: portfolios.spaceType,
      })
      .from(portfolios)
      .innerJoin(
        workerProfiles,
        eq(portfolios.workerProfileId, workerProfiles.id),
      )
      .orderBy(desc(portfolios.createdAt))
      .limit(limit * 2); // 이미지 없는 것 필터링 감안해 더 많이 조회

    if (rows.length === 0) return [];

    const portfolioIds = rows.map((r) => r.id);

    // 각 포트폴리오의 첫 번째 이미지 조회
    const mediaRows = await this.db
      .select({
        portfolioId: portfolioMedia.portfolioId,
        mediaUrl: portfolioMedia.mediaUrl,
      })
      .from(portfolioMedia)
      .where(inArray(portfolioMedia.portfolioId, portfolioIds))
      .orderBy(portfolioMedia.displayOrder);

    // portfolioId → 첫 번째 이미지 URL 매핑
    const thumbnailMap = new Map<string, string>();
    for (const m of mediaRows) {
      if (!thumbnailMap.has(m.portfolioId)) {
        thumbnailMap.set(m.portfolioId, m.mediaUrl);
      }
    }

    const SPACE_TYPE_LABELS: Record<string, string> = {
      RESIDENTIAL: '주거',
      COMMERCIAL: '상업',
      OTHER: '기타',
    };

    return rows
      .filter((r) => thumbnailMap.has(r.id))
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        title: r.title,
        thumbnailUrl: thumbnailMap.get(r.id) ?? null,
        workerName: r.businessName ?? '블루칼라 기술자',
        category: SPACE_TYPE_LABELS[r.spaceType ?? ''] ?? r.spaceType ?? '시공',
      }));
  }

  /**
   * 플랫폼 통계 조회 (소셜 프루프용)
   *
   * 랜딩 페이지 히어로 섹션에서 사용하는 워커 수를 반환합니다.
   * 데이터가 없으면 0을 반환 — 프론트에서 0이면 숨김 처리.
   *
   * @returns 활성 워커 수
   */
  async getStats(): Promise<{ workerCount: number }> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(workerProfiles);

    return { workerCount: result[0]?.count ?? 0 };
  }

  /**
   * 워커 검색 (검색 페이지용)
   *
   * 키워드(사업명, 경력 요약), 전문 분야 코드, 활동 지역 코드, 경력 연수로 필터링합니다.
   * 각 워커의 포트폴리오 수와 대표 이미지를 포함하여 반환합니다.
   *
   * @param query 검색 키워드 (사업명 또는 경력 요약 대상)
   * @param fieldName 전문 분야 한국어 이름 (masterCodes.name, 예: "타일")
   * @param areaCode 활동 지역 코드 (예: "AREA_SEOUL_GN")
   * @param minYears 최소 경력 연수
   * @param maxYears 최대 경력 연수
   * @param verifiedOnly 사업자 인증 워커만 조회
   * @param sort 정렬 기준 ("latest" | "portfolio")
   * @param limit 최대 반환 수 (기본 20)
   */
  async searchWorkers(params: {
    query?: string;
    fieldCode?: string;
    areaCode?: string;
    minYears?: number;
    maxYears?: number;
    verifiedOnly?: boolean;
    sort?: 'latest' | 'portfolio';
    limit?: number;
  }): Promise<
    Array<{
      id: string;
      slug: string;
      businessName: string;
      profileImageUrl: string | null;
      careerSummary: string | null;
      yearsOfExperience: number | null;
      businessVerified: boolean;
      officeCity: string | null;
      officeDistrict: string | null;
      fields: string[];
      portfolioCount: number;
      thumbnailUrl: string | null;
    }>
  > {
    const {
      query,
      fieldCode,
      areaCode,
      minYears,
      maxYears,
      verifiedOnly,
      sort,
      limit = 20,
    } = params;

    // Step 1: workerProfiles 기본 필터링
    const conditions: ReturnType<typeof eq>[] = [];
    if (query) {
      conditions.push(
        or(
          ilike(workerProfiles.businessName, `%${query}%`),
          ilike(workerProfiles.careerSummary, `%${query}%`),
        ) as ReturnType<typeof eq>,
      );
    }
    if (verifiedOnly) {
      conditions.push(eq(workerProfiles.businessVerified, true));
    }
    if (minYears !== undefined) {
      conditions.push(gte(workerProfiles.yearsOfExperience, minYears));
    }
    if (maxYears !== undefined) {
      conditions.push(lte(workerProfiles.yearsOfExperience, maxYears));
    }

    const baseQuery = this.db
      .select({
        id: workerProfiles.id,
        slug: workerProfiles.slug,
        businessName: workerProfiles.businessName,
        profileImageUrl: workerProfiles.profileImageUrl,
        careerSummary: workerProfiles.careerSummary,
        yearsOfExperience: workerProfiles.yearsOfExperience,
        businessVerified: workerProfiles.businessVerified,
        officeCity: workerProfiles.officeCity,
        officeDistrict: workerProfiles.officeDistrict,
        createdAt: workerProfiles.createdAt,
      })
      .from(workerProfiles)
      .$dynamic();

    const profileRows =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery;

    if (profileRows.length === 0) return [];

    let profileIds = profileRows.map((p) => p.id);

    // Step 2: 전문 분야 코드 필터 (workerFields 조인)
    if (fieldCode) {
      const matchingFields = await this.db
        .select({ workerProfileId: workerFields.workerProfileId })
        .from(workerFields)
        .where(
          and(
            inArray(workerFields.workerProfileId, profileIds),
            eq(workerFields.fieldCode, fieldCode),
          ),
        );
      const matchingIds = new Set(matchingFields.map((f) => f.workerProfileId));
      profileIds = profileIds.filter((id) => matchingIds.has(id));
    }

    // Step 3: 활동 지역 코드 필터 (workerAreas 조인)
    if (areaCode) {
      const matchingAreas = await this.db
        .select({ workerProfileId: workerAreas.workerProfileId })
        .from(workerAreas)
        .where(
          and(
            inArray(workerAreas.workerProfileId, profileIds),
            eq(workerAreas.areaCode, areaCode),
          ),
        );
      const matchingIds = new Set(matchingAreas.map((a) => a.workerProfileId));
      profileIds = profileIds.filter((id) => matchingIds.has(id));
    }

    if (profileIds.length === 0) return [];

    // Step 4: 전문 분야 목록 일괄 조회
    const allFields = await this.db
      .select({
        workerProfileId: workerFields.workerProfileId,
        fieldCode: workerFields.fieldCode,
      })
      .from(workerFields)
      .where(inArray(workerFields.workerProfileId, profileIds));

    // Step 5: 포트폴리오 수 + 대표 이미지 조회
    const allPortfolios = await this.db
      .select({
        id: portfolios.id,
        workerProfileId: portfolios.workerProfileId,
        createdAt: portfolios.createdAt,
      })
      .from(portfolios)
      .where(inArray(portfolios.workerProfileId, profileIds))
      .orderBy(desc(portfolios.createdAt));

    const portfolioIds = allPortfolios.map((p) => p.id);
    let mediaRows: { portfolioId: string; mediaUrl: string }[] = [];
    if (portfolioIds.length > 0) {
      mediaRows = await this.db
        .select({
          portfolioId: portfolioMedia.portfolioId,
          mediaUrl: portfolioMedia.mediaUrl,
        })
        .from(portfolioMedia)
        .where(inArray(portfolioMedia.portfolioId, portfolioIds))
        .orderBy(portfolioMedia.displayOrder);
    }

    // Step 6: 인메모리 그룹핑
    const fieldsByWorker = new Map<string, string[]>();
    allFields.forEach((f) => {
      const arr = fieldsByWorker.get(f.workerProfileId) ?? [];
      arr.push(f.fieldCode);
      fieldsByWorker.set(f.workerProfileId, arr);
    });

    // 워커별 포트폴리오 수
    const portfolioCountByWorker = new Map<string, number>();
    // 워커별 최신 포트폴리오 ID (대표 이미지용)
    const latestPortfolioByWorker = new Map<string, string>();
    allPortfolios.forEach((p) => {
      portfolioCountByWorker.set(
        p.workerProfileId,
        (portfolioCountByWorker.get(p.workerProfileId) ?? 0) + 1,
      );
      if (!latestPortfolioByWorker.has(p.workerProfileId)) {
        latestPortfolioByWorker.set(p.workerProfileId, p.id);
      }
    });

    // 포트폴리오별 첫 번째 이미지
    const thumbnailByPortfolio = new Map<string, string>();
    mediaRows.forEach((m) => {
      if (!thumbnailByPortfolio.has(m.portfolioId)) {
        thumbnailByPortfolio.set(m.portfolioId, m.mediaUrl);
      }
    });

    // Step 7: 결과 조립 및 정렬 (Set으로 O(n) 필터)
    const profileIdSet = new Set(profileIds);
    const filteredProfiles = profileRows.filter((p) => profileIdSet.has(p.id));

    const results = filteredProfiles.map((p) => {
      const latestPortId = latestPortfolioByWorker.get(p.id);
      const thumbnailUrl = latestPortId
        ? (thumbnailByPortfolio.get(latestPortId) ?? null)
        : null;

      return {
        id: p.id,
        slug: p.slug,
        businessName: p.businessName,
        profileImageUrl: p.profileImageUrl,
        careerSummary: p.careerSummary,
        yearsOfExperience: p.yearsOfExperience,
        businessVerified: p.businessVerified,
        officeCity: p.officeCity,
        officeDistrict: p.officeDistrict,
        fields: fieldsByWorker.get(p.id) ?? [],
        portfolioCount: portfolioCountByWorker.get(p.id) ?? 0,
        thumbnailUrl,
        _createdAt: p.createdAt,
      };
    });

    // 정렬
    results.sort((a, b) => {
      if (sort === 'portfolio') return b.portfolioCount - a.portfolioCount;
      // 기본: 최신 가입순
      return (
        new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      );
    });

    return results
      .slice(0, limit)
      .map(({ _createdAt: _ignored, ...rest }) => rest);
  }

  /**
   * 공개 프로필 의뢰 접수
   *
   * 고객이 워커 공개 프로필에서 의뢰를 보낼 때 호출됩니다.
   * 현재는 로그만 남기고 성공을 반환합니다.
   * Phase 2에서 SMS 알림 또는 이메일 발송 연동 예정.
   *
   * @param slug 워커 슬러그
   * @param payload 의뢰 내용
   */
  async submitInquiry(
    slug: string,
    payload: {
      name: string;
      phone: string;
      location: string;
      workType: string;
      budget?: string;
      message?: string;
      projectTitle?: string;
    },
  ): Promise<{ ok: true; message: string }> {
    // 슬러그로 워커 프로필 존재 확인
    const profiles = await this.db
      .select({
        id: workerProfiles.id,
        businessName: workerProfiles.businessName,
      })
      .from(workerProfiles)
      .where(eq(workerProfiles.slug, slug))
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new NotFoundException('해당 슬러그의 프로필을 찾을 수 없습니다');
    }

    this.logger.info(
      {
        slug,
        workerProfileId: profiles[0].id,
        clientName: payload.name,
        workType: payload.workType,
        location: payload.location,
      },
      '의뢰 접수',
    );

    // TODO Phase 2: SMS/이메일 알림 발송
    // await this.smsService.send(profiles[0].officePhoneNumber, `새 의뢰 — ${payload.name}: ${payload.location}`);

    return { ok: true, message: '의뢰가 접수되었습니다.' };
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
