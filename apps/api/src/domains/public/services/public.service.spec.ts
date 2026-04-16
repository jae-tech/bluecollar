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
});
