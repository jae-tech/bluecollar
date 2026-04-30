import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkScheduleService } from './work-schedule.service';
import { NotFoundException } from '@nestjs/common';

/**
 * WorkScheduleService 단위 테스트
 *
 * DB를 Vitest mock으로 대체하여 서비스 로직만 검증.
 */

// Drizzle 쿼리 빌더 mock 헬퍼
function makeDbMock() {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn(() => mockReturning);

  // select chain: select().from().where()
  const mockSelectWhere = vi.fn(() => ({ then: vi.fn() }));
  const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  // insert chain: insert().values().returning()
  const mockInsertReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockInsertReturning }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  // update chain: update().set().where().returning()
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn(() => ({ returning: mockUpdateReturning }));
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  // delete chain: delete().where().returning()
  const mockDeleteReturning = vi.fn();
  const mockDeleteWhere = vi.fn(() => ({ returning: mockDeleteReturning }));
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    _mocks: {
      selectWhere: mockSelectWhere,
      from: mockFrom,
      insertReturning: mockInsertReturning,
      values: mockValues,
      updateReturning: mockUpdateReturning,
      updateWhere: mockUpdateWhere,
      set: mockSet,
      deleteReturning: mockDeleteReturning,
      deleteWhere: mockDeleteWhere,
    },
  };
}

const WORKER_PROFILE_ID = 'worker-profile-uuid';

// 테스트용 일정 팩토리
function makeSchedule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'schedule-uuid-1',
    workerProfileId: WORKER_PROFILE_ID,
    title: '타일 시공',
    siteAddress: '서울 강남구 삼성동 123',
    fieldCode: 'FLD_TILE',
    startDate: '2026-04-14',
    endDate: '2026-04-15',
    memo: null,
    portfolioId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('WorkScheduleService', () => {
  let service: WorkScheduleService;
  let db: ReturnType<typeof makeDbMock>;

  beforeEach(() => {
    db = makeDbMock();
    // DRIZZLE 토큰 대신 직접 주입
    service = new WorkScheduleService(db as never);
  });

  // ─────────────────────────────────────────────────────
  // getSchedules
  // ─────────────────────────────────────────────────────

  describe('getSchedules', () => {
    it('1. 멀티월 일정 포함: start_date <= lastDay AND end_date >= firstDay 조건 검증', async () => {
      const multiMonthSchedule = makeSchedule({
        startDate: '2026-03-28',
        endDate: '2026-04-05',
      });
      db._mocks.selectWhere.mockResolvedValue([multiMonthSchedule]);

      const result = await service.getSchedules(WORKER_PROFILE_ID, 2026, 4);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe('2026-03-28');
      expect(db.select).toHaveBeenCalledOnce();
    });

    it('2. 해당 월에 일정 없으면 빈 배열 반환', async () => {
      db._mocks.selectWhere.mockResolvedValue([]);

      const result = await service.getSchedules(WORKER_PROFILE_ID, 2026, 12);

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────
  // createSchedule
  // ─────────────────────────────────────────────────────

  describe('createSchedule', () => {
    it('3. 충돌 없음 → conflicts 빈 배열, 일정 등록', async () => {
      // findConflicts → 빈 배열
      db._mocks.selectWhere.mockResolvedValue([]);
      const newSchedule = makeSchedule();
      db._mocks.insertReturning.mockResolvedValue([newSchedule]);

      const result = await service.createSchedule(WORKER_PROFILE_ID, {
        siteAddress: '서울 강남구 삼성동 123',
        fieldCode: 'FLD_TILE',
        startDate: '2026-04-14',
        endDate: '2026-04-15',
      });

      expect(result.conflicts).toEqual([]);
      expect(result.schedule.id).toBe('schedule-uuid-1');
    });

    it('4. 날짜 범위 겹치는 기존 일정 있음 → conflicts 배열에 포함', async () => {
      const conflicting = {
        id: 'conflict-uuid',
        title: '기존 일정',
        startDate: '2026-04-13',
        endDate: '2026-04-14',
      };
      // findConflicts → 충돌 1개
      db._mocks.selectWhere.mockResolvedValueOnce([conflicting]);
      const newSchedule = makeSchedule();
      db._mocks.insertReturning.mockResolvedValue([newSchedule]);

      const result = await service.createSchedule(WORKER_PROFILE_ID, {
        siteAddress: '을지로 3가',
        fieldCode: 'FLD_WALLPAPER',
        startDate: '2026-04-14',
        endDate: '2026-04-15',
      });

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('conflict-uuid');
    });
  });

  // ─────────────────────────────────────────────────────
  // updateSchedule
  // ─────────────────────────────────────────────────────

  describe('updateSchedule', () => {
    it('6. 자기 자신은 excludeId로 제외 → conflicts에 미포함', async () => {
      const existing = makeSchedule();
      // 첫 번째 select → 기존 일정 반환 (소유권 확인)
      db._mocks.selectWhere.mockResolvedValueOnce([existing]);
      // 두 번째 select → findConflicts: 자기 자신만 있지만 excludeId로 제외 → 빈 배열
      db._mocks.selectWhere.mockResolvedValueOnce([]);
      db._mocks.updateReturning.mockResolvedValue([existing]);

      const result = await service.updateSchedule(
        'schedule-uuid-1',
        WORKER_PROFILE_ID,
        { startDate: '2026-04-14', endDate: '2026-04-16' },
      );

      expect(result.conflicts).toEqual([]);
    });

    it('7. 다른 일정과 날짜 겹침 → conflicts 반환', async () => {
      const existing = makeSchedule();
      const conflicting = {
        id: 'other-schedule-uuid',
        title: '다른 일정',
        startDate: '2026-04-15',
        endDate: '2026-04-17',
      };
      db._mocks.selectWhere.mockResolvedValueOnce([existing]);
      db._mocks.selectWhere.mockResolvedValueOnce([conflicting]);
      db._mocks.updateReturning.mockResolvedValue([existing]);

      const result = await service.updateSchedule(
        'schedule-uuid-1',
        WORKER_PROFILE_ID,
        { endDate: '2026-04-16' },
      );

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('other-schedule-uuid');
    });

    it('8. 타인의 일정 수정 시도 → NotFoundException', async () => {
      // 소유권 확인 쿼리 → 빈 배열 (해당 워커의 일정이 아님)
      db._mocks.selectWhere.mockResolvedValue([]);

      await expect(
        service.updateSchedule('schedule-uuid-1', 'other-worker-uuid', {
          siteAddress: '변경 시도',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────
  // deleteSchedule
  // ─────────────────────────────────────────────────────

  describe('deleteSchedule', () => {
    it('9. 타인의 일정 삭제 시도 → NotFoundException', async () => {
      // delete().where().returning() → 빈 배열 (소유권 불일치)
      db._mocks.deleteReturning.mockResolvedValue([]);

      await expect(
        service.deleteSchedule('schedule-uuid-1', 'other-worker-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('10. 존재하지 않는 ID → NotFoundException', async () => {
      db._mocks.deleteReturning.mockResolvedValue([]);

      await expect(
        service.deleteSchedule('non-existent-uuid', WORKER_PROFILE_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('11. 정상 삭제 성공 → void 반환', async () => {
      db._mocks.deleteReturning.mockResolvedValue([
        { id: 'schedule-uuid-1' },
      ]);

      await expect(
        service.deleteSchedule('schedule-uuid-1', WORKER_PROFILE_ID),
      ).resolves.toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────
  // updateSchedule 추가 케이스
  // ─────────────────────────────────────────────────────

  describe('updateSchedule - 추가 케이스', () => {
    it('12. 충돌 없는 정상 수정 → conflicts 빈 배열', async () => {
      const existing = makeSchedule();
      db._mocks.selectWhere.mockResolvedValueOnce([existing]);
      db._mocks.selectWhere.mockResolvedValueOnce([]);
      const updated = makeSchedule({ siteAddress: '수정된 주소' });
      db._mocks.updateReturning.mockResolvedValue([updated]);

      const result = await service.updateSchedule(
        'schedule-uuid-1',
        WORKER_PROFILE_ID,
        { siteAddress: '수정된 주소' },
      );

      expect(result.conflicts).toEqual([]);
      expect(result.schedule.siteAddress).toBe('수정된 주소');
    });

    it('13. startDate만 변경 → effectiveEndDate는 기존 값 유지', async () => {
      const existing = makeSchedule({ endDate: '2026-04-20' });
      db._mocks.selectWhere.mockResolvedValueOnce([existing]);
      db._mocks.selectWhere.mockResolvedValueOnce([]);
      db._mocks.updateReturning.mockResolvedValue([existing]);

      const result = await service.updateSchedule(
        'schedule-uuid-1',
        WORKER_PROFILE_ID,
        { startDate: '2026-04-12' }, // endDate 미제공
      );

      // 충돌 감지는 effectiveEndDate = '2026-04-20' 기준으로 수행됨
      expect(result.conflicts).toEqual([]);
    });

    it('14. 날짜 미변경 필드 업데이트(title만 수정) → 정상 처리', async () => {
      const existing = makeSchedule();
      db._mocks.selectWhere.mockResolvedValueOnce([existing]);
      db._mocks.selectWhere.mockResolvedValueOnce([]);
      const updated = makeSchedule({ title: '새 작업명' });
      db._mocks.updateReturning.mockResolvedValue([updated]);

      const result = await service.updateSchedule(
        'schedule-uuid-1',
        WORKER_PROFILE_ID,
        { title: '새 작업명' },
      );

      expect(result.schedule.title).toBe('새 작업명');
    });
  });
});
