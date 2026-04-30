import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminDocumentsService } from './admin-documents.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminNotificationService } from './admin-notification.service';

/** 드리즐 체이너블 mock 헬퍼 */
function makeChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'update',
    'set',
  ];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  // 최종 await 시 returnValue 반환
  (chain as Promise<unknown> & Record<string, unknown>)[Symbol.asyncIterator] =
    undefined;
  Object.defineProperty(chain, 'then', {
    get() {
      return (resolve: (v: unknown) => void) => resolve(returnValue);
    },
  });
  return chain;
}

describe('AdminDocumentsService', () => {
  let service: AdminDocumentsService;
  let db: Record<string, ReturnType<typeof vi.fn>>;
  let auditService: { log: ReturnType<typeof vi.fn> };
  let notificationService: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auditService = { log: vi.fn().mockResolvedValue(undefined) };
    notificationService = { emit: vi.fn() };

    db = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(),
    };

    service = new AdminDocumentsService(
      db as never,
      { setContext: vi.fn(), info: vi.fn(), warn: vi.fn() } as never,
      auditService as unknown as AdminAuditService,
      notificationService as unknown as AdminNotificationService,
    );
  });

  describe('approve()', () => {
    it('PENDING 서류를 트랜잭션으로 승인 처리한다', async () => {
      // findOne — PENDING 서류 반환
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 'doc-1',
            status: 'PENDING',
            workerProfileId: 'wp-1',
          },
        ]),
      };
      db.select.mockReturnValue(selectChain);
      db.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            update: vi.fn().mockReturnValue({
              set: vi
                .fn()
                .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
            }),
            insert: vi
              .fn()
              .mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
          };
          return fn(tx);
        },
      );

      const result = await service.approve('doc-1', 'admin-1');

      expect(result).toEqual({ id: 'doc-1', status: 'APPROVED' });
      expect(db.transaction).toHaveBeenCalledOnce();
      expect(auditService.log).toHaveBeenCalledWith(
        'admin-1',
        'DOCUMENT_APPROVE',
        'business_document',
        'doc-1',
        { status: 'PENDING' },
        { status: 'APPROVED' },
      );
      expect(notificationService.emit).toHaveBeenCalledWith(
        'NEW_DOCUMENT',
        expect.any(Object),
      );
    });

    it('서류를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      db.select.mockReturnValue(selectChain);

      await expect(service.approve('not-exist', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('PENDING이 아닌 서류 승인 시 ConflictException을 던진다', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([
            { id: 'doc-2', status: 'APPROVED', workerProfileId: 'wp-1' },
          ]),
      };
      db.select.mockReturnValue(selectChain);

      await expect(service.approve('doc-2', 'admin-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('reject()', () => {
    it('PENDING 서류를 사유와 함께 거절 처리한다', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([
            { id: 'doc-3', status: 'PENDING', workerProfileId: 'wp-1' },
          ]),
      };
      db.select.mockReturnValue(selectChain);
      db.transaction.mockImplementation(
        async (fn: (tx: unknown) => unknown) => {
          const tx = {
            update: vi.fn().mockReturnValue({
              set: vi
                .fn()
                .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
            }),
            insert: vi
              .fn()
              .mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
          };
          return fn(tx);
        },
      );

      const result = await service.reject('doc-3', 'admin-1', '서류 불분명');

      expect(result).toEqual({ id: 'doc-3', status: 'REJECTED' });
      expect(auditService.log).toHaveBeenCalledWith(
        'admin-1',
        'DOCUMENT_REJECT',
        'business_document',
        'doc-3',
        { status: 'PENDING' },
        { status: 'REJECTED', reason: '서류 불분명' },
      );
    });

    it('PENDING이 아닌 서류 거절 시 ConflictException을 던진다', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([
            { id: 'doc-4', status: 'REJECTED', workerProfileId: 'wp-1' },
          ]),
      };
      db.select.mockReturnValue(selectChain);

      await expect(service.reject('doc-4', 'admin-1', '사유')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
