import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { InquiryEmailService } from './inquiry-email.service';

/**
 * InquiryService 단위 테스트
 *
 * DrizzleDB와 InquiryEmailService를 vi.fn()으로 mock 처리.
 * 서비스의 비즈니스 로직(rate limit, 권한 검증, 상태 전환)만 검증한다.
 *
 * Drizzle 쿼리 체인 mock 전략:
 * - SELECT 쿼리들은 최종 메서드(.limit / .offset)에서 resolve
 * - count 집계 쿼리(.select().from().where())는 .where()에서 resolve
 *   → where.mockResolvedValueOnce로 순차 제어
 * - INSERT/UPDATE는 .returning()에서 resolve
 */

/** 기본 체인 — 모든 메서드가 this를 반환하되 필요 시 override */
function makeChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = () => chain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.offset = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue([]);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  void self;
  return chain;
}

function makeEmailService() {
  return {
    sendInquiryNotification: vi.fn().mockResolvedValue(undefined),
  } as unknown as InquiryEmailService;
}

// 유효한 의뢰 DTO
const validDto = {
  name: '홍길동',
  phone: '010-1234-5678',
  location: '서울 강남구',
  workType: '욕실 타일',
};

describe('InquiryService', () => {
  let service: InquiryService;
  let db: ReturnType<typeof makeChain>;
  let emailService: InquiryEmailService;

  beforeEach(() => {
    db = makeChain();
    emailService = makeEmailService();
    service = new InquiryService(db as never, emailService);
  });

  // ─────────────────────────────────────────────────────
  // createInquiry
  // ─────────────────────────────────────────────────────

  describe('createInquiry', () => {
    it('1. 워커 slug 없음 → NotFoundException', async () => {
      // workerProfiles 조회: .limit() → []
      db.limit.mockResolvedValueOnce([]);

      await expect(
        service.createInquiry('client-uuid', 'non-existent-slug', validDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('2. 24시간 3건 초과 → 429 HttpException', async () => {
      // 1) workerProfiles 조회
      db.limit.mockResolvedValueOnce([
        {
          id: 'worker-profile-uuid',
          businessName: '홍길동 타일',
          userId: 'worker-user-uuid',
        },
      ]);
      // 2) workerUser 조회
      db.limit.mockResolvedValueOnce([{ email: 'worker@example.com' }]);
      // count 쿼리: .where()가 terminal — 앞선 2번의 .where() 호출은 chain 반환
      // workerProfiles.where, workerUser.where → chain 반환 (이미 기본값)
      // 3번째 .where() → count 결과 resolve
      db.where
        .mockReturnValueOnce(db) // workerProfiles 쿼리 .where()
        .mockReturnValueOnce(db) // workerUser 쿼리 .where()
        .mockResolvedValueOnce([{ cnt: 3 }]); // count 쿼리 .where() — terminal

      await expect(
        service.createInquiry('client-uuid', 'valid-slug', validDto),
      ).rejects.toThrow(HttpException);
    });

    it('3. 정상 의뢰 생성 성공', async () => {
      const mockInquiry = { id: 'inquiry-uuid', ...validDto };

      // 1) workerProfiles 조회
      db.limit.mockResolvedValueOnce([
        {
          id: 'worker-profile-uuid',
          businessName: '홍길동 타일',
          userId: 'worker-user-uuid',
        },
      ]);
      // 2) workerUser 조회
      db.limit.mockResolvedValueOnce([{ email: 'worker@example.com' }]);
      // 3) count 쿼리: 3번째 .where() → cnt=0 resolve
      db.where
        .mockReturnValueOnce(db) // workerProfiles
        .mockReturnValueOnce(db) // workerUser
        .mockResolvedValueOnce([{ cnt: 0 }]); // count (terminal)
      // 4) INSERT → returning
      db.returning.mockResolvedValueOnce([mockInquiry]);

      const result = await service.createInquiry(
        'client-uuid',
        'valid-slug',
        validDto,
      );

      expect(result).toEqual(mockInquiry);
    });
  });

  // ─────────────────────────────────────────────────────
  // getInquiriesForWorker
  // ─────────────────────────────────────────────────────

  describe('getInquiriesForWorker', () => {
    it('4. 워커 프로필 ID로 의뢰 목록 조회', async () => {
      const mockList = [{ id: 'inquiry-1' }, { id: 'inquiry-2' }];
      db.offset.mockResolvedValueOnce(mockList);

      const result = await service.getInquiriesForWorker('worker-profile-uuid');
      expect(result).toEqual(mockList);
    });

    it('5. 상태 필터 포함 조회', async () => {
      const mockList = [{ id: 'inquiry-1', status: 'PENDING' }];
      db.offset.mockResolvedValueOnce(mockList);

      const result = await service.getInquiriesForWorker(
        'worker-profile-uuid',
        'PENDING',
      );
      expect(result).toEqual(mockList);
    });
  });

  // ─────────────────────────────────────────────────────
  // getInquiriesForClient
  // ─────────────────────────────────────────────────────

  describe('getInquiriesForClient', () => {
    it('6. 클라이언트 user ID로 의뢰 목록 조회', async () => {
      const mockList = [{ id: 'inquiry-1' }];
      db.offset.mockResolvedValueOnce(mockList);

      const result = await service.getInquiriesForClient('client-uuid');
      expect(result).toEqual(mockList);
    });
  });

  // ─────────────────────────────────────────────────────
  // updateInquiryStatus
  // ─────────────────────────────────────────────────────

  describe('updateInquiryStatus', () => {
    it('7. 의뢰 없음 → NotFoundException', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(
        service.updateInquiryStatus('inquiry-uuid', 'worker-profile-uuid', {
          status: 'READ',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('8. 다른 워커의 의뢰 수정 → ForbiddenException', async () => {
      db.limit.mockResolvedValueOnce([
        { id: 'inquiry-uuid', workerProfileId: 'another-worker-profile-uuid' },
      ]);

      await expect(
        service.updateInquiryStatus('inquiry-uuid', 'my-worker-profile-uuid', {
          status: 'READ',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('9. 정상 상태 변경 → 성공', async () => {
      const mockUpdated = { id: 'inquiry-uuid', status: 'READ' };
      db.limit.mockResolvedValueOnce([
        { id: 'inquiry-uuid', workerProfileId: 'worker-profile-uuid' },
      ]);
      db.returning.mockResolvedValueOnce([mockUpdated]);

      const result = await service.updateInquiryStatus(
        'inquiry-uuid',
        'worker-profile-uuid',
        { status: 'READ' },
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  // ─────────────────────────────────────────────────────
  // cancelInquiry
  // ─────────────────────────────────────────────────────

  describe('cancelInquiry', () => {
    it('10. 의뢰 없음 → NotFoundException', async () => {
      db.limit.mockResolvedValueOnce([]);

      await expect(
        service.cancelInquiry('inquiry-uuid', 'client-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('11. 다른 클라이언트의 의뢰 취소 → ForbiddenException', async () => {
      db.limit.mockResolvedValueOnce([
        {
          id: 'inquiry-uuid',
          clientUserId: 'another-client-uuid',
          status: 'PENDING',
        },
      ]);

      await expect(
        service.cancelInquiry('inquiry-uuid', 'my-client-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('12. 이미 취소된 의뢰 → ForbiddenException', async () => {
      db.limit.mockResolvedValueOnce([
        {
          id: 'inquiry-uuid',
          clientUserId: 'client-uuid',
          status: 'CANCELLED',
        },
      ]);

      await expect(
        service.cancelInquiry('inquiry-uuid', 'client-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('13. 정상 취소 → status CANCELLED 반환', async () => {
      const mockCancelled = { id: 'inquiry-uuid', status: 'CANCELLED' };
      db.limit.mockResolvedValueOnce([
        {
          id: 'inquiry-uuid',
          clientUserId: 'client-uuid',
          status: 'PENDING',
        },
      ]);
      db.returning.mockResolvedValueOnce([mockCancelled]);

      const result = await service.cancelInquiry('inquiry-uuid', 'client-uuid');
      expect(result).toEqual(mockCancelled);
    });
  });
});
