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
 * - createPortfolio: 포트폴리오 생성 (트랜잭션, rooms/tags/media roomId 바인딩)
 * - updatePortfolio: 포트폴리오 수정 (트랜잭션, 소유권 검증, rooms 교체)
 * - deletePortfolio: 포트폴리오 삭제 (소유권 검증)
 * - getPortfolioById: 포트폴리오 단건 조회 (rooms 포함)
 * - getPortfoliosByWorker: 워커 포트폴리오 목록 조회 (N+1 방지 배치 로드)
 * - validateMaterialIds: materialId 사전 검증
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

  /**
   * Drizzle 체이닝 패턴을 모킹하는 헬퍼
   * select().from().where().limit() / orderBy() 패턴 지원
   */
  const makeSelectChain = (result: any[]) => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnThis();
    chain.where = vi.fn().mockReturnThis();
    chain.limit = vi.fn().mockResolvedValue(result);
    chain.orderBy = vi.fn().mockResolvedValue(result);
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

  const mockRoom = {
    id: 'room-uuid-123',
    portfolioId: 'portfolio-uuid-123',
    roomType: 'BATHROOM',
    roomLabel: '안방 욕실',
    displayOrder: 0,
  };

  const mockTag = {
    tagName: '포세린 타일',
    materialId: 'mat-uuid-123',
    roomId: null,
  };

  const mockMedia = {
    id: 'm1',
    portfolioId: 'portfolio-uuid-123',
    mediaUrl: 'https://example.com/before.jpg',
    mediaType: 'IMAGE',
    imageType: 'BEFORE',
    displayOrder: 1,
    description: null,
    roomId: null,
  };

  describe('createPortfolio', () => {
    it('미디어, rooms, tags와 함께 포트폴리오를 트랜잭션으로 생성해야 함', async () => {
      const createDto = {
        workerProfileId: mockWorkerProfile.id,
        title: '강남 타일 공사',
        content: '상세한 시공 설명입니다.',
        rooms: [
          {
            roomType: 'BATHROOM' as const,
            roomLabel: '안방 욕실',
            displayOrder: 0,
          },
        ],
        tags: [{ tagName: '포세린 타일', materialId: 'mat-uuid-123' }],
        media: [
          {
            mediaUrl: 'https://example.com/before.jpg',
            mediaType: 'IMAGE' as const,
            imageType: 'BEFORE' as const,
          },
        ],
      };

      // insert 체인: values().returning() 또는 values() (upsert 없음)
      const makeInsertChain = (returnValue?: any[]) => ({
        values: vi.fn().mockReturnValue(
          returnValue
            ? { returning: vi.fn().mockResolvedValue(returnValue) }
            : {
                returning: undefined,
                then: (res: any) => Promise.resolve().then(res),
              },
        ),
      });

      mockDb.transaction.mockImplementation(async (fn: any) => {
        let selectCallCount = 0;
        const tx = {
          select: vi.fn().mockImplementation(() => {
            selectCallCount++;
            // 1: 워커 프로필, 2: materialId 검증, 3-6: Promise.all(media, details, tags, rooms)
            if (selectCallCount === 1)
              return makeSelectChain([mockWorkerProfile]);
            if (selectCallCount === 2)
              return makeSelectChain([{ id: 'mat-uuid-123' }]);
            // Promise.all 4개 조회
            return makeSelectChain([mockMedia]);
          }),
          insert: vi
            .fn()
            .mockReturnValueOnce({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPortfolio]),
              }),
            }) // portfolios insert
            .mockReturnValue({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'room-uuid-123' }]),
                then: (res: any) => Promise.resolve(undefined).then(res),
              }),
            }), // 나머지 insert (details, rooms, tags, media) — returning() 지원
        };
        return fn(tx);
      });

      const result = await portfolioService.createPortfolio(createDto as any);

      expect(result.id).toBe(mockPortfolio.id);
      expect(result.title).toBe(createDto.title);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('워커 프로필이 없으면 BadRequestException을 throw해야 함', async () => {
      const createDto = {
        workerProfileId: 'non-existent-wp',
        title: '테스트 포트폴리오',
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

      await expect(
        portfolioService.createPortfolio(createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 materialId가 있으면 BadRequestException을 throw해야 함', async () => {
      const createDto = {
        workerProfileId: mockWorkerProfile.id,
        title: '테스트 포트폴리오',
        tags: [{ tagName: '없는자재', materialId: 'non-existent-mat-id' }],
        media: [
          {
            mediaUrl: 'https://example.com/img.jpg',
            mediaType: 'IMAGE' as const,
          },
        ],
      };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        let selectCallCount = 0;
        const tx = {
          select: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1)
              return makeSelectChain([mockWorkerProfile]);
            // materialId 검증: 빈 배열 반환 (존재하지 않음)
            return makeSelectChain([]);
          }),
          insert: vi.fn(),
        };
        return fn(tx);
      });

      await expect(
        portfolioService.createPortfolio(createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rooms 배열을 제공하면 portfolioRooms에 저장해야 함', async () => {
      const createDto = {
        workerProfileId: mockWorkerProfile.id,
        title: '강남 욕실 타일 시공',
        rooms: [
          { roomType: 'BATHROOM' as const, roomLabel: '안방 욕실' },
          { roomType: 'LIVING' as const },
        ],
        media: [
          {
            mediaUrl: 'https://example.com/img.jpg',
            mediaType: 'IMAGE' as const,
          },
        ],
      };

      const roomsInsertMock = vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 'room-uuid-1' }, { id: 'room-uuid-2' }]),
      });

      mockDb.transaction.mockImplementation(async (fn: any) => {
        let insertCallCount = 0;
        const tx = {
          select: vi.fn().mockReturnValue(makeSelectChain([mockWorkerProfile])),
          insert: vi.fn().mockImplementation(() => {
            insertCallCount++;
            if (insertCallCount === 1) {
              // portfolios insert
              return {
                values: vi.fn().mockReturnValue({
                  returning: vi.fn().mockResolvedValue([mockPortfolio]),
                }),
              };
            }
            if (insertCallCount === 2) {
              // portfolioRooms insert — rooms 배열 값 검증 (returning() 호출됨)
              return { values: roomsInsertMock };
            }
            return {
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([]),
                then: (res: any) => Promise.resolve(undefined).then(res),
              }),
            };
          }),
        };
        return fn(tx);
      });

      await portfolioService.createPortfolio(createDto as any);

      // rooms insert가 2개 row로 호출되었는지 확인
      expect(roomsInsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            roomType: 'BATHROOM',
            roomLabel: '안방 욕실',
          }),
          expect.objectContaining({ roomType: 'LIVING' }),
        ]),
      );
    });
  });

  describe('updatePortfolio', () => {
    const portfolioId = mockPortfolio.id;
    const workerProfileId = mockPortfolio.workerProfileId;

    it('소유권 검증 후 포트폴리오를 업데이트해야 함', async () => {
      const updateDto = { title: '수정된 제목입니다' };
      const updatedPortfolio = { ...mockPortfolio, ...updateDto };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue(makeSelectChain([mockPortfolio])),
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
      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([])), // 없음
        };
        return fn(tx);
      });

      await expect(
        portfolioService.updatePortfolio(portfolioId, workerProfileId, {
          title: '수정',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 워커의 포트폴리오 수정 시 ForbiddenException을 throw해야 함', async () => {
      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([mockPortfolio])),
        };
        return fn(tx);
      });

      await expect(
        portfolioService.updatePortfolio(portfolioId, 'another-worker-id', {
          title: '수정',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rooms 제공 시 기존 rooms를 삭제하고 재삽입해야 함', async () => {
      const updateDto = {
        rooms: [{ roomType: 'KITCHEN' as const }],
      };

      const deleteRoomsMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValue(makeSelectChain([mockPortfolio])),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPortfolio]),
              }),
            }),
          }),
          delete: deleteRoomsMock,
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'room-uuid-new' }]),
              then: (res: any) => Promise.resolve(undefined).then(res),
            }),
          }),
        };
        return fn(tx);
      });

      await portfolioService.updatePortfolio(
        portfolioId,
        workerProfileId,
        updateDto,
      );

      // rooms 삭제가 호출되었는지 확인
      expect(deleteRoomsMock).toHaveBeenCalled();
    });

    it('tags 제공 시 객체 배열로 저장해야 함', async () => {
      const updateDto = {
        tags: [{ tagName: '포세린 타일', materialId: 'mat-uuid-123' }],
      };

      const tagsInsertValuesMock = vi.fn().mockResolvedValue(undefined);
      let insertCallCount = 0;

      mockDb.transaction.mockImplementation(async (fn: any) => {
        let selectCallCount = 0;
        const tx = {
          select: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) return makeSelectChain([mockPortfolio]);
            // materialId 검증
            return makeSelectChain([{ id: 'mat-uuid-123' }]);
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPortfolio]),
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
          insert: vi.fn().mockImplementation(() => {
            insertCallCount++;
            return { values: tagsInsertValuesMock };
          }),
        };
        return fn(tx);
      });

      await portfolioService.updatePortfolio(
        portfolioId,
        workerProfileId,
        updateDto,
      );

      // tags insert가 materialId 포함한 객체 배열로 호출되었는지 확인
      expect(tagsInsertValuesMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            tagName: '포세린 타일',
            materialId: 'mat-uuid-123',
          }),
        ]),
      );
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
    it('포트폴리오와 미디어, rooms, tags를 함께 반환해야 함', async () => {
      const portfolioId = mockPortfolio.id;

      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockPortfolio])) // portfolios 조회
        .mockReturnValueOnce(makeSelectChain([mockMedia])) // portfolioMedia
        .mockReturnValueOnce(makeSelectChain([])) // portfolioDetails
        .mockReturnValueOnce(makeSelectChain([mockTag])) // portfolioTags
        .mockReturnValueOnce(makeSelectChain([mockRoom])); // portfolioRooms

      const result = await portfolioService.getPortfolioById(portfolioId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(portfolioId);
      expect(result!.media).toBeDefined();
      expect(result!.rooms).toBeDefined();
      expect(result!.tags).toBeDefined();
    });

    it('포트폴리오가 없으면 null을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await portfolioService.getPortfolioById('non-existent-id');

      expect(result).toBeNull();
    });

    it('costVisibility가 PRIVATE이면 actualCost를 마스킹해야 함', async () => {
      const portfolioWithCost = {
        ...mockPortfolio,
        costVisibility: 'PRIVATE',
        actualCost: '5000000',
      };

      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([portfolioWithCost]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]))
        .mockReturnValueOnce(makeSelectChain([]));

      const result = await portfolioService.getPortfolioById(mockPortfolio.id);

      expect(result!.actualCost).toBeNull();
    });
  });

  describe('getPortfoliosByWorker', () => {
    it('워커의 모든 포트폴리오를 미디어 및 rooms와 함께 반환해야 함', async () => {
      const workerPortfolios = [mockPortfolio];
      const allMedia = [{ ...mockMedia, portfolioId: mockPortfolio.id }];
      const allRooms = [{ ...mockRoom, portfolioId: mockPortfolio.id }];

      let selectCallCount = 0;
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) return makeSelectChain(workerPortfolios); // 포트폴리오 목록
        if (selectCallCount === 2) return makeSelectChain(allMedia); // 배치 미디어
        if (selectCallCount === 3) return makeSelectChain(allRooms); // 배치 rooms
        return makeSelectChain([]);
      });

      const result = await portfolioService.getPortfoliosByWorker(
        mockPortfolio.workerProfileId,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockPortfolio.id);
      expect(result[0].media).toHaveLength(1);
      expect(result[0].rooms).toHaveLength(1);
    });

    it('포트폴리오가 없으면 빈 배열을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await portfolioService.getPortfoliosByWorker(
        'no-portfolio-worker',
      );

      expect(result).toEqual([]);
    });

    it('N+1 방지: portfolioIds를 inArray로 한 번에 조회해야 함 (Promise.all 2개 쿼리)', async () => {
      const workerPortfolios = [mockPortfolio];
      let selectCallCount = 0;
      mockDb.select = vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) return makeSelectChain(workerPortfolios);
        return makeSelectChain([]);
      });

      await portfolioService.getPortfoliosByWorker(
        mockPortfolio.workerProfileId,
      );

      // 포트폴리오 목록 1번 + Promise.all로 media/rooms 2번 = 총 3번
      expect(mockDb.select).toHaveBeenCalledTimes(3);
    });
  });
});
