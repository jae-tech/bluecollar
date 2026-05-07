import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

/**
 * PublicService Unit Tests
 *
 * 테스트 대상:
 * - getPublicProfile: Slug 기반 공개 프로필 조회
 * - incrementPortfolioViewCount: 포트폴리오 조회수 증가
 */
describe('PublicService', () => {
  let publicService: PublicService;
  let mockDb: any;
  let mockLogger: any;

  const makeSelectChain = (result: any[]) => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnThis();
    chain.where = vi.fn().mockReturnThis();
    chain.limit = vi.fn().mockResolvedValue(result);
    chain.orderBy = vi.fn().mockReturnThis();
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve(result).then(resolve, reject);
    return chain;
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      update: vi.fn(),
    };

    mockLogger = {
      setContext: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    publicService = new PublicService(mockDb, mockLogger);
  });

  const mockWorkerProfile = {
    id: 'wp-uuid-123',
    userId: 'user-uuid-123',
    slug: 'kim-tile',
    businessName: '김타일 전문공사',
    description: '15년 경력의 타일 전문가입니다.',
    businessVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-uuid-123',
    phoneNumber: '01012345678',
    realName: '김철수',
    role: 'WORKER',
  };

  const mockPortfolio = {
    id: 'portfolio-uuid-123',
    workerProfileId: 'wp-uuid-123',
    title: '강남 아파트 타일 공사',
    content: '상세 설명...',
    viewCount: 10,
    costVisibility: 'PUBLIC',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMedia = [
    {
      id: 'media-uuid-1',
      portfolioId: 'portfolio-uuid-123',
      mediaUrl: 'https://example.com/before.jpg',
      mediaType: 'IMAGE',
      imageType: 'BEFORE',
      displayOrder: 1,
    },
  ];

  describe('getPublicProfile', () => {
    it('Slug로 공개 프로필 전체 정보를 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockWorkerProfile])) // 프로필
        .mockReturnValueOnce(makeSelectChain([mockUser])) // 유저
        .mockReturnValueOnce(
          makeSelectChain([
            { workerProfileId: 'wp-uuid-123', fieldCode: 'FLD_TILE' },
          ]),
        ) // fields
        .mockReturnValueOnce(
          makeSelectChain([
            { workerProfileId: 'wp-uuid-123', areaCode: 'AREA_SEOUL_GN' },
          ]),
        ) // areas
        .mockReturnValueOnce(makeSelectChain([mockPortfolio])) // 포트폴리오
        // Promise.all(media, details, tags, rooms)
        .mockReturnValueOnce(makeSelectChain(mockMedia)) // 미디어
        .mockReturnValueOnce(makeSelectChain([])) // portfolioDetails
        .mockReturnValueOnce(makeSelectChain([])) // portfolioTags
        .mockReturnValueOnce(makeSelectChain([])); // portfolioRooms (추가)

      const result = await publicService.getPublicProfile('kim-tile');

      expect(result.profile.slug).toBe('kim-tile');
      expect(result.profile.businessName).toBe('김타일 전문공사');
      expect(result.user).not.toBeNull();
      expect(result.user!.realName).toBe('김철수');
      expect(result.fields).toHaveLength(1);
      expect(result.areas).toHaveLength(1);
      expect(result.portfolios).toHaveLength(1);
      expect(result.portfolios[0].media).toHaveLength(1);
    });

    it('존재하지 않는 Slug로 조회 시 NotFoundException을 throw해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      await expect(
        publicService.getPublicProfile('non-existent-slug'),
      ).rejects.toThrow(NotFoundException);
    });

    it('유저 정보가 없어도 user를 null로 반환해야 함 (빈 배열 처리)', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockWorkerProfile]))
        .mockReturnValueOnce(makeSelectChain([])) // 유저 없음 (빈 배열)
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]));

      const result = await publicService.getPublicProfile('kim-tile');

      // userData가 빈 배열이어도 user가 null이어야 함 (버그 수정 확인)
      expect(result.user).toBeNull();
    });

    it('포트폴리오가 없어도 빈 배열로 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockWorkerProfile]))
        .mockReturnValueOnce(makeSelectChain([mockUser]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([])); // 포트폴리오 없음

      const result = await publicService.getPublicProfile('kim-tile');

      expect(result.portfolios).toEqual([]);
    });

    it('포트폴리오 정보에서 costVisibility가 포함되어야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockWorkerProfile]))
        .mockReturnValueOnce(makeSelectChain([mockUser]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([mockPortfolio]))
        // Promise.all(media, details, tags, rooms)
        .mockReturnValueOnce(makeSelectChain(mockMedia))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([])); // portfolioRooms (추가)

      const result = await publicService.getPublicProfile('kim-tile');

      expect(result.portfolios[0].costVisibility).toBe('PUBLIC');
    });
  });

  describe('incrementPortfolioViewCount', () => {
    it('포트폴리오 조회수를 1 증가시켜야 함', async () => {
      const portfolio = { id: 'portfolio-uuid-123', viewCount: 5 };

      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([portfolio]));
      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await publicService.incrementPortfolioViewCount('portfolio-uuid-123');

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('포트폴리오가 없어도 예외를 throw하지 않아야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      // 에러를 throw하지 않아야 함
      await expect(
        publicService.incrementPortfolioViewCount('non-existent-id'),
      ).resolves.not.toThrow();
    });

    it('DB 에러 발생 시 경고 로그만 남기고 계속 실행되어야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(
          makeSelectChain([{ id: 'portfolio-uuid-123', viewCount: 0 }]),
        );
      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('DB error')),
        }),
      });

      // 에러를 throw하지 않고 warn 로그만 남겨야 함
      await expect(
        publicService.incrementPortfolioViewCount('portfolio-uuid-123'),
      ).resolves.not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // searchWorkers — tsvector 풀텍스트 검색
  // ─────────────────────────────────────────────────────
  describe('searchWorkers', () => {
    /**
     * searchWorkers mock 구조:
     *   1차 select → 프로필 행 (rank 포함)
     *   2차 select → workerFields (fieldCode 필터용)
     *   3차 select → workerAreas  (areaCode 필터용)
     *   4차 select → workerFields (전문 분야 목록)
     *   5차 select → portfolios   (포트폴리오 수)
     *   6차 select → portfolioMedia (대표 이미지)
     */
    const makeSearchChain = (result: any[]) => {
      const chain: any = {};
      chain.from = vi.fn().mockReturnThis();
      chain.where = vi.fn().mockReturnThis();
      chain.limit = vi.fn().mockReturnThis();
      chain.orderBy = vi.fn().mockReturnThis();
      chain.$dynamic = vi.fn().mockReturnThis();
      // then을 정의해 await 시 result 반환
      chain.then = (resolve: any, reject: any) =>
        Promise.resolve(result).then(resolve, reject);
      return chain;
    };

    const mockProfileRow = {
      id: 'wp-uuid-1',
      slug: 'kim-tile',
      businessName: '김타일 전문공사',
      profileImageUrl: null,
      careerSummary: '15년 경력 타일 전문가',
      yearsOfExperience: 15,
      businessVerified: true,
      officeCity: '서울',
      officeDistrict: '강남구',
      createdAt: new Date('2026-01-01'),
      rank: 0.8,
    };

    it('query 없이 전체 조회 시 모든 워커를 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSearchChain([mockProfileRow])) // 프로필
        .mockReturnValueOnce(
          makeSearchChain([
            { workerProfileId: 'wp-uuid-1', fieldCode: 'FLD_TILE' },
          ]),
        ) // allFields
        .mockReturnValueOnce(makeSearchChain([])) // portfolios
        .mockReturnValueOnce(makeSearchChain([])); // media

      const results = await publicService.searchWorkers({});

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('wp-uuid-1');
      expect(results[0].fields).toContain('FLD_TILE');
    });

    it('fieldCode 필터 적용 시 해당 분야 워커만 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSearchChain([mockProfileRow])) // 프로필
        .mockReturnValueOnce(
          makeSearchChain([{ workerProfileId: 'wp-uuid-1' }]),
        ) // fieldCode 필터 매칭
        .mockReturnValueOnce(
          makeSearchChain([
            { workerProfileId: 'wp-uuid-1', fieldCode: 'FLD_TILE' },
          ]),
        ) // allFields
        .mockReturnValueOnce(makeSearchChain([])) // portfolios
        .mockReturnValueOnce(makeSearchChain([])); // media

      const results = await publicService.searchWorkers({
        fieldCode: 'FLD_TILE',
      });

      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('kim-tile');
    });

    it('fieldCode 필터에서 매칭 없으면 빈 배열 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSearchChain([mockProfileRow])) // 프로필
        .mockReturnValueOnce(makeSearchChain([])); // fieldCode 필터 — 매칭 없음

      const results = await publicService.searchWorkers({
        fieldCode: 'FLD_PLUMBING',
      });

      expect(results).toHaveLength(0);
    });

    it('verifiedOnly=true 시 인증 워커만 반환해야 함', async () => {
      const unverifiedProfile = {
        ...mockProfileRow,
        id: 'wp-uuid-2',
        businessVerified: false,
      };
      mockDb.select = vi
        .fn()
        // verifiedOnly 조건은 DB 쿼리에서 필터링되므로 mock에서 이미 필터된 결과 반환
        .mockReturnValueOnce(makeSearchChain([mockProfileRow])) // 인증 워커만 반환
        .mockReturnValueOnce(
          makeSearchChain([
            { workerProfileId: 'wp-uuid-1', fieldCode: 'FLD_TILE' },
          ]),
        )
        .mockReturnValueOnce(makeSearchChain([]))
        .mockReturnValueOnce(makeSearchChain([]));

      const results = await publicService.searchWorkers({ verifiedOnly: true });

      expect(results).toHaveLength(1);
      expect(results[0].businessVerified).toBe(true);
    });

    it('sort=portfolio 시 포트폴리오 수 내림차순으로 정렬해야 함', async () => {
      const profile2 = {
        ...mockProfileRow,
        id: 'wp-uuid-2',
        slug: 'lee-electric',
        rank: 0.5,
      };
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSearchChain([mockProfileRow, profile2])) // 프로필 2개
        .mockReturnValueOnce(
          makeSearchChain([
            { workerProfileId: 'wp-uuid-1', fieldCode: 'FLD_TILE' },
            { workerProfileId: 'wp-uuid-2', fieldCode: 'FLD_ELEC' },
          ]),
        ) // allFields
        .mockReturnValueOnce(
          makeSearchChain([
            // profile2가 포트폴리오 3개, profile1이 1개
            {
              id: 'port-1',
              workerProfileId: 'wp-uuid-2',
              createdAt: new Date(),
            },
            {
              id: 'port-2',
              workerProfileId: 'wp-uuid-2',
              createdAt: new Date(),
            },
            {
              id: 'port-3',
              workerProfileId: 'wp-uuid-2',
              createdAt: new Date(),
            },
            {
              id: 'port-4',
              workerProfileId: 'wp-uuid-1',
              createdAt: new Date(),
            },
          ]),
        ) // portfolios
        .mockReturnValueOnce(makeSearchChain([])); // media

      const results = await publicService.searchWorkers({ sort: 'portfolio' });

      expect(results[0].id).toBe('wp-uuid-2'); // 포트폴리오 3개인 워커가 첫 번째
      expect(results[0].portfolioCount).toBe(3);
    });

    it('결과가 없으면 빈 배열을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSearchChain([])); // 프로필 없음

      const results = await publicService.searchWorkers({
        query: '존재하지않는키워드xyz',
      });

      expect(results).toHaveLength(0);
    });

    it('limit보다 많은 결과는 limit 수만큼 잘려야 함', async () => {
      const profiles = Array.from({ length: 10 }, (_, i) => ({
        ...mockProfileRow,
        id: `wp-uuid-${i}`,
        slug: `worker-${i}`,
        rank: 0,
        createdAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}`),
      }));
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSearchChain(profiles))
        .mockReturnValueOnce(makeSearchChain([]))
        .mockReturnValueOnce(makeSearchChain([]))
        .mockReturnValueOnce(makeSearchChain([]));

      const results = await publicService.searchWorkers({ limit: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });
});
