import { isSlugReserved } from '../constants/reserved-slugs';

/**
 * Slug 유효성 검사 함수
 *
 * 예약어 체크 외에 추가적인 validation을 수행합니다.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  // 길이 검증
  if (slug.length < 3) {
    return {
      valid: false,
      error: 'slug는 최소 3자 이상이어야 합니다',
    };
  }

  if (slug.length > 50) {
    return {
      valid: false,
      error: 'slug는 최대 50자 이하여야 합니다',
    };
  }

  // 포맷 검증: 소문자, 숫자, 하이픈만 허용
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return {
      valid: false,
      error: 'slug는 소문자, 숫자, 하이픈만 포함할 수 있습니다',
    };
  }

  // 하이픈 검증
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      valid: false,
      error: 'slug는 하이픈으로 시작하거나 끝날 수 없습니다',
    };
  }

  if (slug.includes('--')) {
    return {
      valid: false,
      error: 'slug에 연속된 하이픈이 포함될 수 없습니다',
    };
  }

  // 예약어 검증
  if (isSlugReserved(slug)) {
    return {
      valid: false,
      error:
        'This slug is reserved and cannot be used. Please choose a different slug.',
    };
  }

  return { valid: true };
}
