import { describe, it, expect } from 'vitest';
import { validateSlug } from './slug.validator';

describe('validateSlug', () => {
  // 정상 케이스
  describe('valid slugs', () => {
    it('영문 소문자만', () => {
      expect(validateSlug('abc')).toEqual({ valid: true });
    });

    it('소문자 + 숫자 혼합', () => {
      expect(validateSlug('hong123')).toEqual({ valid: true });
    });

    it('소문자 + 하이픈', () => {
      expect(validateSlug('hong-gildong')).toEqual({ valid: true });
    });

    it('최대 50자', () => {
      expect(validateSlug('a'.repeat(50))).toEqual({ valid: true });
    });

    it('최소 3자', () => {
      expect(validateSlug('abc')).toEqual({ valid: true });
    });
  });

  // 길이 검증
  describe('length validation', () => {
    it('2자 이하 → 에러', () => {
      const result = validateSlug('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3자');
    });

    it('51자 이상 → 에러', () => {
      const result = validateSlug('a'.repeat(51));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50자');
    });
  });

  // 포맷 검증
  describe('format validation', () => {
    it('대문자 포함 → 에러', () => {
      const result = validateSlug('HongGildong');
      expect(result.valid).toBe(false);
    });

    it('특수문자 포함 → 에러', () => {
      const result = validateSlug('hong_gildong');
      expect(result.valid).toBe(false);
    });

    it('공백 포함 → 에러', () => {
      const result = validateSlug('hong gildong');
      expect(result.valid).toBe(false);
    });

    it('한글 포함 → 에러', () => {
      const result = validateSlug('홍길동');
      expect(result.valid).toBe(false);
    });
  });

  // 첫 글자 숫자 금지 (신규 규칙)
  describe('no leading digit', () => {
    it('숫자로 시작 → 에러', () => {
      const result = validateSlug('1abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('숫자로 시작');
    });

    it('0으로 시작 → 에러', () => {
      const result = validateSlug('0abc');
      expect(result.valid).toBe(false);
    });

    it('숫자로 끝나는 건 허용', () => {
      expect(validateSlug('abc1')).toEqual({ valid: true });
    });

    it('중간에 숫자 있는 건 허용', () => {
      expect(validateSlug('a1b2c')).toEqual({ valid: true });
    });
  });

  // 하이픈 규칙
  describe('hyphen rules', () => {
    it('하이픈으로 시작 → 에러', () => {
      const result = validateSlug('-abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('하이픈');
    });

    it('하이픈으로 종료 → 에러', () => {
      const result = validateSlug('abc-');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('하이픈');
    });

    it('연속 하이픈 → 에러', () => {
      const result = validateSlug('abc--def');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('연속');
    });

    it('단일 하이픈은 허용', () => {
      expect(validateSlug('abc-def')).toEqual({ valid: true });
    });
  });

  // 예약어 검증
  describe('reserved slugs', () => {
    it('admin → 에러', () => {
      const result = validateSlug('admin');
      expect(result.valid).toBe(false);
    });

    it('api → 에러', () => {
      const result = validateSlug('api');
      expect(result.valid).toBe(false);
    });

    it('ADMIN 대문자 → 에러 (case-insensitive)', () => {
      const result = validateSlug('ADMIN');
      // 포맷 검증(대문자 불가)에서 먼저 걸림 — 어느 쪽이든 invalid
      expect(result.valid).toBe(false);
    });

    it('예약어 prefix 사용은 허용 (admin-plumbing)', () => {
      expect(validateSlug('admin-plumbing')).toEqual({ valid: true });
    });

    it('일반 단어는 허용', () => {
      expect(validateSlug('hong-gildong')).toEqual({ valid: true });
    });
  });
});
