import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService — findAll()', () => {
  let service: AdminAuditService;
  let db: Record<string, ReturnType<typeof vi.fn>>;

  const makeSelectChain = (result: unknown) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(result),
    };
    return chain;
  };

  const makeCountChain = (total: number) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ total }]),
  });

  beforeEach(() => {
    db = { select: vi.fn() };
    service = new AdminAuditService(
      db as never,
      { setContext: vi.fn(), warn: vi.fn() } as never,
    );
  });

  it('필터 없이 전체 로그를 최신순으로 반환한다', async () => {
    const mockLogs = [
      { id: 'l-1', action: 'CODE_CREATE', createdAt: new Date().toISOString() },
    ];

    db.select
      .mockReturnValueOnce(makeCountChain(1))
      .mockReturnValueOnce(makeSelectChain(mockLogs));

    const result = await service.findAll({ page: 1, limit: 30 });

    expect(result.data).toEqual(mockLogs);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('액션 필터를 적용해 조회한다', async () => {
    db.select
      .mockReturnValueOnce(makeCountChain(0))
      .mockReturnValueOnce(makeSelectChain([]));

    const result = await service.findAll({
      page: 1,
      limit: 30,
      action: 'DOCUMENT_APPROVE',
    });

    expect(result.data).toHaveLength(0);
  });

  it('페이지네이션이 올바르게 동작한다', async () => {
    db.select
      .mockReturnValueOnce(makeCountChain(60))
      .mockReturnValueOnce(makeSelectChain([]));

    const result = await service.findAll({ page: 2, limit: 30 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
  });
});

describe('AdminAuditService — log() 민감 필드 마스킹', () => {
  it('password와 token 키를 ***로 치환해 저장한다', async () => {
    const insertMock = { values: vi.fn().mockResolvedValue(undefined) };
    const db = { insert: vi.fn().mockReturnValue(insertMock) };

    const service = new AdminAuditService(
      db as never,
      { setContext: vi.fn(), warn: vi.fn() } as never,
    );

    await service.log(
      'admin-1',
      'USER_STATUS_CHANGE',
      'user',
      'u-1',
      { status: 'ACTIVE', password: 'secret123' },
      { status: 'SUSPENDED', token: 'jwt-abc' },
    );

    expect(insertMock.values).toHaveBeenCalledOnce();
    const calledWith = insertMock.values.mock.calls[0][0] as {
      before: string;
      after: string;
    };

    const before = JSON.parse(calledWith.before);
    const after = JSON.parse(calledWith.after);

    expect(before.password).toBe('***');
    expect(before.status).toBe('ACTIVE');
    expect(after.token).toBe('***');
    expect(after.status).toBe('SUSPENDED');
  });
});
