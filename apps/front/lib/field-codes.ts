/**
 * 전문 분야 코드 → 한국어 레이블 매핑
 *
 * masterCodes 테이블의 FIELD 그룹과 동기화.
 * API가 fieldCode 배열을 반환하면 이 맵으로 한국어로 변환.
 *
 * ⚠️ seed.ts의 FIELD 그룹 변경 시 반드시 여기도 동기화할 것.
 */
export const FIELD_CODE_LABELS: Record<string, string> = {
  // seed.ts masterCodes FIELD 그룹과 동기화 (2026-04-21 기준)
  FLD_DEMOLITION: "철거",
  FLD_WINDOW: "샷시/창호",
  FLD_PLUMBING: "설비/배관",
  FLD_WATERPROOF: "방수",
  FLD_ELECTRIC: "전기",
  FLD_CARPENTRY: "목공",
  FLD_FILM: "필름",
  FLD_PAINTING: "도장/페인팅",
  FLD_TILE: "타일",
  FLD_WALLPAPER: "도배",
  FLD_FLOORING: "장판/마루",
  FLD_KITCHEN: "주방/싱크대",
  FLD_ELASTIC_COAT: "탄성코트",
  FLD_BATHROOM: "욕실",
  FLD_CLEANING: "입주청소",
  FLD_GLAZING: "유리",
  FLD_WELDING: "용접",
  FLD_MACHINING: "기계가공",
  // 견적서 기준 추가 직종 (2026-04-21)
  FLD_PLASTER: "미장",
  FLD_HVAC: "에어컨/냉난방",
  FLD_FURNITURE: "가구/붙박이",
};

/**
 * 유효한 공정 코드 배열 — DTO Zod enum 검증용.
 *
 * ⚠️ FIELD_CODE_LABELS와 동기화 유지. seed.ts의 FIELD 그룹 변경 시
 * FIELD_CODE_LABELS도 함께 업데이트하면 이 배열도 자동 반영됨.
 *
 * TODO: @repo/schema로 이전하여 프론트/백엔드 단일 진실 원천 보장.
 */
export const VALID_FIELD_CODES = Object.keys(FIELD_CODE_LABELS) as [
  string,
  ...string[],
];
