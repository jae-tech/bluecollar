import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { WorkScheduleController } from './work-schedule.controller';
import { WorkScheduleService } from '../services/work-schedule.service';
import type { UserPayload } from '@/common/types/user.types';

/**
 * WorkScheduleController 단위 테스트
 *
 * WorkScheduleService는 vi.fn()으로 mock 처리하여
 * 컨트롤러의 역할(workerProfileId 검증 → 서비스 위임)만 검증한다.
 */

function makeWorkerUser(
  overrides: Partial<UserPayload> = {},
): UserPayload {
  return {
    sub: 'user-uuid',
    email: 'worker@example.com',
    role: 'WORKER',
    workerProfileId: 'worker-profile-uuid',
    ...overrides,
  } as UserPayload;
}

describe('WorkScheduleController', () => {
  let controller: WorkScheduleController;
  let service: {
    getSchedules: ReturnType<typeof vi.fn>;
    createSchedule: ReturnType<typeof vi.fn>;
    updateSchedule: ReturnType<typeof vi.fn>;
    deleteSchedule: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getSchedules: vi.fn(),
      createSchedule: vi.fn(),
      updateSchedule: vi.fn(),
      deleteSchedule: vi.fn(),
    };
    controller = new WorkScheduleController(
      service as unknown as WorkScheduleService,
    );
  });

  // ─────────────────────────────────────────────────────
  // getWorkerProfileId (ForbiddenException 경로)
  // ─────────────────────────────────────────────────────

  describe('ForbiddenException — workerProfileId 없는 사용자', () => {
    const clientUser = makeWorkerUser({ workerProfileId: undefined });

    it('1. GET /schedule — CLIENT 유저 → ForbiddenException', async () => {
      await expect(
        controller.getSchedules(clientUser, { year: 2026, month: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('2. POST /schedule — workerProfileId=null → ForbiddenException', async () => {
      await expect(
        controller.createSchedule(clientUser, {
          siteAddress: '서울',
          fieldCode: 'FLD_TILE',
          startDate: '2026-04-14',
          endDate: '2026-04-15',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('3. PATCH /schedule/:id — CLIENT 유저 → ForbiddenException', async () => {
      await expect(
        controller.updateSchedule(clientUser, 'some-id', {
          siteAddress: '변경',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('4. DELETE /schedule/:id — CLIENT 유저 → ForbiddenException', async () => {
      await expect(
        controller.deleteSchedule(clientUser, 'some-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─────────────────────────────────────────────────────
  // 정상 경로 — 서비스 위임 검증
  // ─────────────────────────────────────────────────────

  describe('서비스 위임', () => {
    const workerUser = makeWorkerUser();

    it('5. getSchedules → service.getSchedules 호출', async () => {
      service.getSchedules.mockResolvedValue([]);

      await controller.getSchedules(workerUser, { year: 2026, month: 4 });

      expect(service.getSchedules).toHaveBeenCalledWith(
        'worker-profile-uuid',
        2026,
        4,
      );
    });

    it('6. createSchedule → service.createSchedule 호출', async () => {
      const mockResult = { schedule: {}, conflicts: [] };
      service.createSchedule.mockResolvedValue(mockResult);

      const dto = {
        siteAddress: '을지로 5가',
        fieldCode: 'FLD_PAINT',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
      };
      await controller.createSchedule(workerUser, dto);

      expect(service.createSchedule).toHaveBeenCalledWith(
        'worker-profile-uuid',
        dto,
      );
    });

    it('7. updateSchedule → service.updateSchedule 호출', async () => {
      const mockResult = { schedule: {}, conflicts: [] };
      service.updateSchedule.mockResolvedValue(mockResult);

      await controller.updateSchedule(workerUser, 'schedule-id', {
        siteAddress: '수정 주소',
      });

      expect(service.updateSchedule).toHaveBeenCalledWith(
        'schedule-id',
        'worker-profile-uuid',
        { siteAddress: '수정 주소' },
      );
    });

    it('8. deleteSchedule → service.deleteSchedule 호출', async () => {
      service.deleteSchedule.mockResolvedValue(undefined);

      await controller.deleteSchedule(workerUser, 'schedule-id');

      expect(service.deleteSchedule).toHaveBeenCalledWith(
        'schedule-id',
        'worker-profile-uuid',
      );
    });
  });
});
