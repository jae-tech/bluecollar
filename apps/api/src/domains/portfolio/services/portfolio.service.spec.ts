import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

/**
 * PortfolioService Unit Tests
 *
 * 테스트 대상:
 * - createPortfolio: 포트폴리오 생성 (트랜잭션)
 * - updatePortfolio: 포트폴리오 수정 (트랜잭션, 소유권 검증)
 * - deletePortfolio: 포트폴리오 삭제 (소유권 검증)
 * - getPortfolioById: 포트폴리오 단건 조회
 * - getPortfoliosByWorker: 워커 포트폴리오 목록 조회
 */
describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(() => {
    mockDb = {
      transaction: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
    };

    mockLogger = {
      setContext: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    portfolioService = new PortfolioService(mockDb, mockLogger);
  });

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

  const mockWorkerProfile = { id: 'wp-uuid-123', slug: 'test-worker' };

  const mockPortfolio = {
    id: 'portfolio-uuid-123',
    workerProfileId: 'wp-uuid-123',
    title: '강남 타일 공사',
    content: '상세한 시공 설명입니다.',
    costVisibility: 'PRIVATE',
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createPortfolio', () => {
    it('미디어와 함께 포트폴리오를 트랜잭션으로 생성해야 함', async () => {
      const createDto = {
        workerProfileId: mockWorkerProfile.id,
        title: '강남 타일 공사',
        content: '상세한 시공 설명입니다.',
        media: [
          {
            mediaUrl: 'https://example.com/before.jpg',
            mediaType: 'IMAGE' as const,
            imageType: 'BEFORE' as const,
          },
          {
            mediaUrl: 'https://example.com/after.jpg',
            mediaType: 'IMAGE' as const,
            imageType: 'AFTER' as const,
          },
        ],
      };

      const savedMedia = [
        {
          id: 'm1',
          portfolioId: mockPortfolio.id,
          mediaUrl: 'https://example.com/before.jpg',
          mediaType: 'IMAGE',
          imageType: 'BEFORE',
          displayOrder: 1,
          description: null,
        },
        {
          id: 'm2',
          portfolioId: mockPortfolio.id,
          mediaUrl: 'https://example.com/after.jpg',
          mediaType: 'IMAGE',
          imageType: 'AFTER',
          displayOrder: 2,
          description: null,
        },
      ];

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi
            .fn()
            .mockReturnValueOnce(makeSelectChain([mockWorkerProfile])) // 워커 프로필 확인
            .mockReturnValueOnce(makeSelectChain(savedMedia)), // 저장된 미디어 조회
          insert: vi
            .fn()
            .mockReturnValueOnce({
              values: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([mockPortfolio]),
            }) // portfolios insert
            .mockReturnValueOnce({
              values: vi.fn().mockResolvedValue(undefined),
            }), // portfolioMedia insert
        };
        return fn(tx);
      });

      const result = await portfolioService.createPortfolio(createDto);

      expect(result.id).toBe(mockPortfolio.id);
      expect(result.title).toBe(createDto.title);
      expect(result.media).toHaveLength(2);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('워커 프로필이 없으면 BadRequestException을 throw해야 함', async () => {
      const createDto = {
        workerProfileId: 'non-existent-wp',
        title: '테스트 포트폴리오',
        content: '10자 이상의 상세 내용',
        media: [
          {
            mediaUrl: 'https://example.com/img.jpg',
            mediaType: 'IMAGE' as const,
          },
        ],
      };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([])), // 프로필 없음
        };
        return fn(tx);
      });

      await expect(portfolioService.createPortfolio(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePortfolio', () => {
    const portfolioId = mockPortfolio.id;
    const workerProfileId = mockPortfolio.workerProfileId;

    it('소유권 검증 후 포트폴리오를 업데이트해야 함', async () => {
      const updateDto = {
        title: '수정된 제목입니다',
        content: '수정된 10자 이상의 내용입니다.',
      };
      const updatedPortfolio = { ...mockPortfolio, ...updateDto };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi
            .fn()
            .mockReturnValueOnce(makeSelectChain([mockPortfolio])) // 포트폴리오 존재 확인
            .mockReturnValueOnce(makeSelectChain([])), // 미디어 조회 (없음)
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedPortfolio]),
              }),
            }),
          }),
        };
        return fn(tx);
      });

      const result = await portfolioService.updatePortfolio(
        portfolioId,
        workerProfileId,
        updateDto,
      );

      expect(result.title).toBe('수정된 제목입니다');
    });

    it('포트폴리오가 없으면 NotFoundException을 throw해야 함', async () => {
      const updateDto = { title: '수정된 제목입니다' };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([])), // 없음
        };
        return fn(tx);
      });

      await expect(
        portfolioService.updatePortfolio(
          portfolioId,
          workerProfileId,
          updateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 워커의 포트폴리오 수정 시 ForbiddenException을 throw해야 함', async () => {
      const updateDto = { title: '수정된 제목입니다' };
      const anotherWorkerProfileId = 'another-worker-wp-id';

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(
            makeSelectChain([mockPortfolio]), // 포트폴리오는 존재하나 다른 워커 소유
          ),
        };
        return fn(tx);
      });

      await expect(
        portfolioService.updatePortfolio(
          portfolioId,
          anotherWorkerProfileId,
          updateDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('미디어 업데이트 시 기존 미디어를 모두 교체해야 함', async () => {
      const newMedia = [
        {
          mediaUrl: 'https://example.com/new.jpg',
          mediaType: 'IMAGE' as const,
        },
      ];
      const updateDto = { media: newMedia };

      const deleteMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi
            .fn()
            .mockReturnValueOnce(makeSelectChain([mockPortfolio]))
            .mockReturnValueOnce(
              makeSelectChain([
                {
                  id: 'new-m1',
                  mediaUrl: 'https://example.com/new.jpg',
                  mediaType: 'IMAGE',
                  displayOrder: 1,
                },
              ]),
            ),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPortfolio]),
              }),
            }),
          }),
          delete: deleteMock,
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return fn(tx);
      });

      await portfolioService.updatePortfolio(
        portfolioId,
        workerProfileId,
        updateDto,
      );

      // 기존 미디어 삭제 확인
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('deletePortfolio', () => {
    const portfolioId = mockPortfolio.id;
    const workerProfileId = mockPortfolio.workerProfileId;

    it('소유권 검증 후 포트폴리오를 삭제해야 함', async () => {
      const deleteMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockPortfolio]));
      mockDb.delete = deleteMock;

      await portfolioService.deletePortfolio(portfolioId, workerProfileId);

      expect(deleteMock).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('포트폴리오가 없으면 NotFoundException을 throw해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      await expect(
        portfolioService.deletePortfolio(portfolioId, workerProfileId),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 워커의 포트폴리오 삭제 시 ForbiddenException을 throw해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockPortfolio]));

      await expect(
        portfolioService.deletePortfolio(portfolioId, 'another-worker-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPortfolioById', () => {
    it('포트폴리오와 미디어를 함께 반환해야 함', async () => {
      const mockMedia = [
        {
          id: 'm1',
          portfolioId: mockPortfolio.id,
          mediaUrl: 'https://example.com/img.jpg',
          mediaType: 'IMAGE',
          displayOrder: 1,
        },
      ];

      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockPortfolio])) // 포트폴리오
        .mockReturnValueOnce(makeSelectChain(mockMedia)); // 미디어

      const result = await portfolioService.getPortfolioById(mockPortfolio.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(mockPortfolio.id);
      expect(result!.media).toHaveLength(1);
    });

    it('포트폴리오가 없으면 null을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await portfolioService.getPortfolioById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getPortfoliosByWorker', () => {
    it('워커의 모든 포트폴리오를 미디어와 함께 반환해야 함', async () => {
      const portfolios = [mockPortfolio];
      const media = [
        { id: 'm1', portfolioId: mockPortfolio.id, displayOrder: 1 },
      ];

      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain(portfolios)) // 포트폴리오 목록
        .mockReturnValueOnce(makeSelectChain(media)); // 첫 포트폴리오 미디어

      const result = await portfolioService.getPortfoliosByWorker(
        mockPortfolio.workerProfileId,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockPortfolio.id);
      expect(result[0].media).toHaveLength(1);
    });

    it('포트폴리오가 없으면 빈 배열을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await portfolioService.getPortfoliosByWorker(
        'no-portfolio-worker',
      );

      expect(result).toEqual([]);
    });
  });
});
