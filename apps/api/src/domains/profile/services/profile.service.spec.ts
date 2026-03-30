import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';

/**
 * ProfileService Unit Tests
 *
 * 테스트 대상:
 * - updateWorkerProfile: 전문 분야 및 활동 지역 업데이트 (트랜잭션)
 * - updateWorkerProfileInfo: 핵심 프로필 정보 수정
 * - getWorkerFields: 전문 분야 조회
 * - getWorkerAreas: 활동 지역 조회
 * - getWorkerProfileInfo: 프로필 정보 통합 조회
 */
describe('ProfileService', () => {
  let profileService: ProfileService;
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

    profileService = new ProfileService(mockDb, mockLogger);
  });

  // Mock 체인 헬퍼 - 체인 마지막에 await 시 result로 resolve됨
  const makeSelectChain = (result: any[]) => {
    const chain: any = {};
    chain.from = vi.fn().mockReturnThis();
    chain.where = vi.fn().mockReturnThis();
    chain.limit = vi.fn().mockResolvedValue(result);
    chain.orderBy = vi.fn().mockReturnThis();
    // 체인 자체를 Thenable로 만들어 .limit() 없이 await 가능하게 함
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve(result).then(resolve, reject);
    return chain;
  };

  describe('updateWorkerProfile', () => {
    const workerProfileId = 'profile-uuid-123';
    const mockProfile = { id: workerProfileId, slug: 'test' };

    it('전문 분야와 활동 지역을 트랜잭션으로 업데이트해야 함', async () => {
      const updateDto = {
        fieldCodes: ['FLD_TILE', 'FLD_PAINTING'],
        areaCodes: ['AREA_SEOUL_GN'],
      };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([mockProfile])), // 프로필 존재 확인
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        };

        // 업데이트 후 조회
        tx.select = vi
          .fn()
          .mockReturnValueOnce(makeSelectChain([mockProfile])) // 존재 확인
          .mockReturnValueOnce(
            makeSelectChain([
              { workerProfileId, fieldCode: 'FLD_TILE' },
              { workerProfileId, fieldCode: 'FLD_PAINTING' },
            ]),
          ) // 업데이트된 fields 조회
          .mockReturnValueOnce(
            makeSelectChain([{ workerProfileId, areaCode: 'AREA_SEOUL_GN' }]),
          ); // 업데이트된 areas 조회

        return fn(tx);
      });

      const result = await profileService.updateWorkerProfile(
        workerProfileId,
        updateDto,
      );

      expect(result.workerProfileId).toBe(workerProfileId);
      expect(result.fields).toHaveLength(2);
      expect(result.areas).toHaveLength(1);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('프로필이 없으면 BadRequestException을 throw해야 함', async () => {
      const updateDto = { fieldCodes: ['FLD_TILE'] };

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi.fn().mockReturnValueOnce(makeSelectChain([])), // 프로필 없음
        };
        return fn(tx);
      });

      await expect(
        profileService.updateWorkerProfile(workerProfileId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('fieldCodes가 빈 배열이면 기존 전문 분야를 모두 삭제해야 함', async () => {
      const updateDto = { fieldCodes: [], areaCodes: ['AREA_SEOUL_GN'] };

      const deleteMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      mockDb.transaction.mockImplementation(async (fn: any) => {
        const tx = {
          select: vi
            .fn()
            .mockReturnValueOnce(makeSelectChain([mockProfile]))
            .mockReturnValueOnce(makeSelectChain([])) // 빈 fields
            .mockReturnValueOnce(
              makeSelectChain([{ workerProfileId, areaCode: 'AREA_SEOUL_GN' }]),
            ),
          delete: deleteMock,
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        };
        return fn(tx);
      });

      const result = await profileService.updateWorkerProfile(
        workerProfileId,
        updateDto,
      );

      // delete가 호출되었는지 확인 (fieldCodes 삭제)
      expect(deleteMock).toHaveBeenCalled();
      expect(result.fields).toHaveLength(0);
    });
  });

  describe('updateWorkerProfileInfo', () => {
    const workerProfileId = 'profile-uuid-123';
    const mockProfile = {
      id: workerProfileId,
      slug: 'test',
      businessName: '기존 사업명',
      description: '기존 설명',
    };

    it('제공된 필드만 부분 업데이트해야 함', async () => {
      const updateDto = {
        businessName: '새로운 사업명',
        description: '새 설명',
      };

      const updatedProfile = { ...mockProfile, ...updateDto };

      // 1번 - 존재 확인, update.returning()
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockProfile]));
      mockDb.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProfile]),
          }),
        }),
      });

      const result = await profileService.updateWorkerProfileInfo(
        workerProfileId,
        updateDto,
      );

      expect(result.businessName).toBe('새로운 사업명');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('프로필이 없으면 NotFoundException을 throw해야 함', async () => {
      const updateDto = { businessName: '새 사업명' };

      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      await expect(
        profileService.updateWorkerProfileInfo(workerProfileId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkerFields', () => {
    const workerProfileId = 'profile-uuid-123';

    it('워커의 전문 분야 목록을 반환해야 함', async () => {
      const mockFields = [
        { workerProfileId, fieldCode: 'FLD_TILE' },
        { workerProfileId, fieldCode: 'FLD_PAINTING' },
      ];

      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain(mockFields));

      const result = await profileService.getWorkerFields(workerProfileId);

      expect(result).toHaveLength(2);
      expect(result[0].fieldCode).toBe('FLD_TILE');
      expect(result[1].fieldCode).toBe('FLD_PAINTING');
    });

    it('전문 분야가 없으면 빈 배열을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await profileService.getWorkerFields(workerProfileId);

      expect(result).toEqual([]);
    });
  });

  describe('getWorkerAreas', () => {
    const workerProfileId = 'profile-uuid-123';

    it('워커의 활동 지역 목록을 반환해야 함', async () => {
      const mockAreas = [{ workerProfileId, areaCode: 'AREA_SEOUL_GN' }];

      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain(mockAreas));

      const result = await profileService.getWorkerAreas(workerProfileId);

      expect(result).toHaveLength(1);
      expect(result[0].areaCode).toBe('AREA_SEOUL_GN');
    });
  });

  describe('getWorkerProfileInfo', () => {
    const workerProfileId = 'profile-uuid-123';
    const mockProfile = {
      id: workerProfileId,
      slug: 'test',
      businessName: '테스트 사업',
    };

    it('프로필, 전문 분야, 활동 지역을 통합하여 반환해야 함', async () => {
      mockDb.select = vi
        .fn()
        .mockReturnValueOnce(makeSelectChain([mockProfile])) // 프로필 조회
        .mockReturnValueOnce(
          makeSelectChain([{ workerProfileId, fieldCode: 'FLD_TILE' }]),
        ) // fields 조회
        .mockReturnValueOnce(
          makeSelectChain([{ workerProfileId, areaCode: 'AREA_SEOUL_GN' }]),
        ); // areas 조회

      const result = await profileService.getWorkerProfileInfo(workerProfileId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(workerProfileId);
      expect(result!.fields).toHaveLength(1);
      expect(result!.areas).toHaveLength(1);
    });

    it('프로필이 없으면 null을 반환해야 함', async () => {
      mockDb.select = vi.fn().mockReturnValueOnce(makeSelectChain([]));

      const result = await profileService.getWorkerProfileInfo(workerProfileId);

      expect(result).toBeNull();
    });
  });
});
