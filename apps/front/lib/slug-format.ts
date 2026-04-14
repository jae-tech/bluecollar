/**
 * slug 포맷 유효성 검사 유틸
 *
 * 백엔드 validateSlug()와 동일한 규칙을 유지해야 합니다.
 * 규칙 변경 시 apps/api/src/common/validators/slug.validator.ts도 함께 수정하세요.
 *
 * 규칙:
 * - 영문 소문자, 숫자, 하이픈(-) 만 허용
 * - 3자 이상, 50자 이하
 * - 숫자로 시작 불가
 * - 하이픈으로 시작/종료 불가
 * - 연속 하이픈 불가
 */
export function isValidSlugFormat(str: string): boolean {
  if (str.length < 3 || str.length > 50) return false;
  if (!/^[a-z0-9-]+$/.test(str)) return false;
  if (/^[0-9]/.test(str)) return false;
  if (str.startsWith("-") || str.endsWith("-")) return false;
  if (str.includes("--")) return false;
  return true;
}
