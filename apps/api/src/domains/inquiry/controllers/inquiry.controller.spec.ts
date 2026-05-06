import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from '../services/inquiry.service';
import type { UserPayload } from '@/common/types/user.types';

/**
 * InquiryController 단위 테스트
 *
 * InquiryService를 vi.fn()으로 mock 처리.
 * 컨트롤러 레벨 로직(workerProfileId 존재 확인, 서비스 위임)만 검증한다.
 * RolesGuard는 NestJS 통합 테스트 레이어에서 검증 — 여기선 제외.
 */

function makeService() {
  return {
    getInquiriesForClient: vi.fn().mockResolvedValue([]),
    getInquiriesForWorker: vi.fn().mockResolvedValue([]),
    createInquiry: vi.fn().mockResolvedValue({ id: 'inquiry-uuid' }),
    updateInquiryStatus: vi.fn().mockResolvedValue({ id: 'inquiry-uuid' }),
    cancelInquiry: vi.fn().mockResolvedValue({ id: 'inquiry-uuid' }),
  } as unknown as InquiryService;
}

const workerUserWithProfile: UserPayload = {
  id: 'user-uuid',
  email: 'worker@example.com',
  role: 'WORKER',
  workerProfileId: 'worker-profile-uuid',
};

const workerUserWithoutProfile: UserPayload = {
  id: 'user-uuid',
  email: 'worker@example.com',
  role: 'WORKER',
  workerProfileId: undefined,
};

const clientUser: UserPayload = {
  id: 'client-uuid',
  email: 'client@example.com',
  role: 'CLIENT',
  workerProfileId: undefined,
};

const defaultQuery = { status: undefined, limit: 20, offset: 0 };

describe('InquiryController', () => {
  let controller: InquiryController;
  let service: InquiryService;

  beforeEach(() => {
    service = makeService();
    controller = new InquiryController(service);
  });

  // ─────────────────────────────────────────────────────
  // GET /inquiries/worker
  // ─────────────────────────────────────────────────────

  describe('getWorkerInquiries', () => {
    it('1. workerProfileId 없는 WORKER → ForbiddenException', async () => {
      await expect(
        controller.getWorkerInquiries(workerUserWithoutProfile, defaultQuery),
      ).rejects.toThrow(ForbiddenException);
    });

    it('2. workerProfileId 있는 WORKER → 서비스 위임', async () => {
      await controller.getWorkerInquiries(workerUserWithProfile, defaultQuery);
      expect(service.getInquiriesForWorker).toHaveBeenCalledWith(
        'worker-profile-uuid',
        undefined,
        20,
        0,
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // PATCH /inquiries/:id/status
  // ─────────────────────────────────────────────────────

  describe('updateInquiryStatus', () => {
    it('3. workerProfileId 없는 WORKER → ForbiddenException', async () => {
      await expect(
        controller.updateInquiryStatus(
          workerUserWithoutProfile,
          'inquiry-uuid',
          { status: 'READ' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('4. workerProfileId 있는 WORKER → 서비스 위임', async () => {
      await controller.updateInquiryStatus(
        workerUserWithProfile,
        'inquiry-uuid',
        { status: 'READ' },
      );
      expect(service.updateInquiryStatus).toHaveBeenCalledWith(
        'inquiry-uuid',
        'worker-profile-uuid',
        { status: 'READ' },
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // GET /inquiries/client
  // ─────────────────────────────────────────────────────

  describe('getClientInquiries', () => {
    it('5. CLIENT → 서비스 위임', async () => {
      await controller.getClientInquiries(clientUser, defaultQuery);
      expect(service.getInquiriesForClient).toHaveBeenCalledWith(
        'client-uuid',
        undefined,
        20,
        0,
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // POST /inquiries/:workerSlug
  // ─────────────────────────────────────────────────────

  describe('createInquiry', () => {
    it('6. CLIENT → 서비스 위임', async () => {
      const dto = {
        name: '홍길동',
        phone: '010-1234-5678',
        location: '서울',
        workType: '타일',
      };
      await controller.createInquiry(clientUser, 'worker-slug', dto);
      expect(service.createInquiry).toHaveBeenCalledWith(
        'client-uuid',
        'worker-slug',
        dto,
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // PATCH /inquiries/:id/cancel
  // ─────────────────────────────────────────────────────

  describe('cancelInquiry', () => {
    it('7. CLIENT → 서비스 위임', async () => {
      await controller.cancelInquiry(clientUser, 'inquiry-uuid');
      expect(service.cancelInquiry).toHaveBeenCalledWith(
        'inquiry-uuid',
        'client-uuid',
      );
    });
  });
});
