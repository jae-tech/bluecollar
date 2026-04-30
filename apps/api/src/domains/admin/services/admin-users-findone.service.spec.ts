import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminAuditService } from './admin-audit.service';

describe('AdminUsersService — findOne()', () => {
  let service: AdminUsersService;
  let db: {
    select: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const makeJoinChain = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  });

  const makeSeparateChain = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(result),
    // 최종 await를 위해 then 오버라이드
    then: (resolve: (v: unknown) => void) => resolve(result),
  });

  beforeEach(() => {
    db = { select: vi.fn(), update: vi.fn() };
    service = new AdminUsersService(
      db as never,
      { setContext: vi.fn(), info: vi.fn(), warn: vi.fn() } as never,
      {} as unknown as AdminAuditService,
    );
  });

  it('유저 + 워커 프로필이 있는 경우 정상 반환한다', async () => {
    const userRow = {
      id: 'u-1',
      email: 'test@test.com',
      realName: '홍길동',
      role: 'WORKER',
      status: 'ACTIVE',
      provider: 'email',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      workerProfileId: 'wp-1',
      slug: 'gildong',
      businessName: '홍길동 타일',
      businessVerified: false,
      yearsOfExperience: 5,
      careerSummary: '5년 경력',
      officeAddress: '서울 강남구',
      officeCity: '서울',
      officeDistrict: '강남구',
    };

    db.select
      .mockReturnValueOnce(makeJoinChain([userRow]))
      .mockReturnValueOnce(makeSeparateChain([])) // businessDocuments
      .mockReturnValueOnce(makeSeparateChain([])); // portfolios

    const result = await service.findOne('u-1');

    expect(result.id).toBe('u-1');
    expect(result.workerProfile).not.toBeNull();
    expect(result.workerProfile?.slug).toBe('gildong');
  });

  it('워커 프로필이 없는 경우 workerProfile: null을 반환한다', async () => {
    const userRow = {
      id: 'u-2',
      email: 'admin@test.com',
      realName: null,
      role: 'ADMIN',
      status: 'ACTIVE',
      provider: 'email',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      workerProfileId: null,
      slug: null,
      businessName: null,
      businessVerified: null,
      yearsOfExperience: null,
      careerSummary: null,
      officeAddress: null,
      officeCity: null,
      officeDistrict: null,
    };

    db.select.mockReturnValueOnce(makeJoinChain([userRow]));

    const result = await service.findOne('u-2');

    expect(result.workerProfile).toBeNull();
  });

  it('유저를 찾지 못하면 NotFoundException을 던진다', async () => {
    db.select.mockReturnValueOnce(makeJoinChain([]));

    await expect(service.findOne('not-exist')).rejects.toThrow(
      NotFoundException,
    );
  });
});
