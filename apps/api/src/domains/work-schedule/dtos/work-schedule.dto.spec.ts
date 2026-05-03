import { describe, it, expect } from 'vitest';
import {
  CreateWorkScheduleSchema,
  UpdateWorkScheduleSchema,
  GetWorkSchedulesQuerySchema,
} from './work-schedule.dto';

/**
 * work-schedule DTO Zod 스키마 단위 테스트
 */

describe('CreateWorkScheduleSchema', () => {
  const validPayload = {
    siteAddress: '서울 강남구 삼성동 123',
    fieldCode: 'FLD_TILE',
    startDate: '2026-04-14',
    endDate: '2026-04-15',
  };

  it('1. 필수 필드만 있어도 통과', () => {
    const result = CreateWorkScheduleSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('2. 선택 필드(title, memo) 포함 시 통과', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      title: '욕실 타일 시공',
      memo: '특이사항 없음',
    });
    expect(result.success).toBe(true);
  });

  it('3. siteAddress 비어 있으면 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      siteAddress: '',
    });
    expect(result.success).toBe(false);
  });

  it('4. fieldCode 비어 있으면 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      fieldCode: '',
    });
    expect(result.success).toBe(false);
  });

  it('5. startDate 형식 불일치(YYYY/MM/DD) → 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      startDate: '2026/04/14',
    });
    expect(result.success).toBe(false);
  });

  it('6. endDate 형식 불일치 → 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      endDate: '20260414',
    });
    expect(result.success).toBe(false);
  });

  it('7. endDate < startDate → refine 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      startDate: '2026-04-15',
      endDate: '2026-04-14',
    });
    expect(result.success).toBe(false);
  });

  it('8. endDate === startDate → 통과 (당일 일정 허용)', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      startDate: '2026-04-14',
      endDate: '2026-04-14',
    });
    expect(result.success).toBe(true);
  });

  it('4-1. fieldCode 유효하지 않은 값 → 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      fieldCode: 'FLD_INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('9. title 100자 초과 → 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      title: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('10. siteAddress 200자 초과 → 오류', () => {
    const result = CreateWorkScheduleSchema.safeParse({
      ...validPayload,
      siteAddress: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateWorkScheduleSchema', () => {
  it('11. 빈 객체도 통과 (모든 필드 선택적)', () => {
    const result = UpdateWorkScheduleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('12. startDate와 endDate 모두 제공, endDate >= startDate → 통과', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      startDate: '2026-04-14',
      endDate: '2026-04-15',
    });
    expect(result.success).toBe(true);
  });

  it('13. startDate만 제공(endDate 미제공) → refine 스킵, 통과', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      startDate: '2026-04-20',
    });
    expect(result.success).toBe(true);
  });

  it('14. endDate만 제공(startDate 미제공) → refine 스킵, 통과', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      endDate: '2026-04-20',
    });
    expect(result.success).toBe(true);
  });

  it('14-1. fieldCode 유효하지 않은 값 → 오류', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      fieldCode: 'FLD_INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('14-2. fieldCode 유효한 값 → 통과', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      fieldCode: 'FLD_WALLPAPER',
    });
    expect(result.success).toBe(true);
  });

  it('15. startDate와 endDate 모두 제공, endDate < startDate → 오류', () => {
    const result = UpdateWorkScheduleSchema.safeParse({
      startDate: '2026-04-15',
      endDate: '2026-04-14',
    });
    expect(result.success).toBe(false);
  });
});

describe('GetWorkSchedulesQuerySchema', () => {
  it('16. 유효한 year/month → 숫자 coerce 후 통과', () => {
    const result = GetWorkSchedulesQuerySchema.safeParse({
      year: '2026',
      month: '4',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2026);
      expect(result.data.month).toBe(4);
    }
  });

  it('17. month=0 → 범위 오류', () => {
    const result = GetWorkSchedulesQuerySchema.safeParse({
      year: '2026',
      month: '0',
    });
    expect(result.success).toBe(false);
  });

  it('18. month=13 → 범위 오류', () => {
    const result = GetWorkSchedulesQuerySchema.safeParse({
      year: '2026',
      month: '13',
    });
    expect(result.success).toBe(false);
  });

  it('19. year=1999 → 범위 오류', () => {
    const result = GetWorkSchedulesQuerySchema.safeParse({
      year: '1999',
      month: '1',
    });
    expect(result.success).toBe(false);
  });

  it('20. year=2101 → 범위 오류', () => {
    const result = GetWorkSchedulesQuerySchema.safeParse({
      year: '2101',
      month: '1',
    });
    expect(result.success).toBe(false);
  });
});
