import { describe, it, expect } from 'vitest';
import {
  CreateInquirySchema,
  UpdateInquiryStatusSchema,
  GetInquiriesQuerySchema,
} from './inquiry.dto';

/**
 * inquiry DTO Zod 스키마 단위 테스트
 */

describe('CreateInquirySchema', () => {
  const validPayload = {
    name: '홍길동',
    phone: '010-1234-5678',
    location: '서울 강남구 삼성동 123',
    workType: '욕실 타일 시공',
  };

  it('1. 필수 필드만 있어도 통과', () => {
    const result = CreateInquirySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('2. 선택 필드(budget, message, projectTitle) 포함 시 통과', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      budget: '500만원 이내',
      message: '가능하면 빨리 해주세요',
      projectTitle: '욕실 리모델링',
    });
    expect(result.success).toBe(true);
  });

  it('3. name 비어 있으면 오류', () => {
    const result = CreateInquirySchema.safeParse({ ...validPayload, name: '' });
    expect(result.success).toBe(false);
  });

  it('4. phone 비어 있으면 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      phone: '',
    });
    expect(result.success).toBe(false);
  });

  it('5. location 비어 있으면 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      location: '',
    });
    expect(result.success).toBe(false);
  });

  it('6. workType 비어 있으면 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      workType: '',
    });
    expect(result.success).toBe(false);
  });

  it('7. name 100자 초과 → 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('8. message 2000자 초과 → 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      message: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('9. location 200자 초과 → 오류', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      location: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('10. name 앞뒤 공백 trim 처리', () => {
    const result = CreateInquirySchema.safeParse({
      ...validPayload,
      name: '  홍길동  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('홍길동');
    }
  });
});

describe('UpdateInquiryStatusSchema', () => {
  it('11. READ 상태 → 통과', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'READ' });
    expect(result.success).toBe(true);
  });

  it('12. REPLIED 상태 → 통과', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'REPLIED' });
    expect(result.success).toBe(true);
  });

  it('13. ACCEPTED 상태 → 통과', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'ACCEPTED' });
    expect(result.success).toBe(true);
  });

  it('14. DECLINED 상태 → 통과', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'DECLINED' });
    expect(result.success).toBe(true);
  });

  it('15. PENDING 상태 → 오류 (워커가 PENDING으로 되돌릴 수 없음)', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'PENDING' });
    expect(result.success).toBe(false);
  });

  it('16. CANCELLED 상태 → 오류 (클라이언트 전용)', () => {
    const result = UpdateInquiryStatusSchema.safeParse({
      status: 'CANCELLED',
    });
    expect(result.success).toBe(false);
  });

  it('17. 유효하지 않은 상태 → 오류', () => {
    const result = UpdateInquiryStatusSchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('18. status 누락 → 오류', () => {
    const result = UpdateInquiryStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('GetInquiriesQuerySchema', () => {
  it('19. 빈 객체 → 기본값 적용 통과', () => {
    const result = GetInquiriesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('20. status 필터 포함 → 통과', () => {
    const result = GetInquiriesQuerySchema.safeParse({ status: 'PENDING' });
    expect(result.success).toBe(true);
  });

  it('21. limit coerce — 문자열 숫자 → 통과', () => {
    const result = GetInquiriesQuerySchema.safeParse({ limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('22. limit=0 → 범위 오류 (최소 1)', () => {
    const result = GetInquiriesQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('23. limit=51 → 범위 오류 (최대 50)', () => {
    const result = GetInquiriesQuerySchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it('24. offset 음수 → 범위 오류', () => {
    const result = GetInquiriesQuerySchema.safeParse({ offset: -1 });
    expect(result.success).toBe(false);
  });

  it('25. 유효하지 않은 status → 오류', () => {
    const result = GetInquiriesQuerySchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });
});
