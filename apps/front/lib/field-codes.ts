/**
 * 전문 분야 코드 → 한국어 레이블 매핑
 *
 * masterCodes 테이블의 FIELD 그룹과 동기화.
 * API가 fieldCode 배열을 반환하면 이 맵으로 한국어로 변환.
 */
export const FIELD_CODE_LABELS: Record<string, string> = {
  FLD_TILE: "타일",
  FLD_PAINTING: "도배",
  FLD_ELECTRIC: "전기",
  FLD_PLUMBING: "배관",
  FLD_WOOD: "목공",
  FLD_METAL: "금속",
  FLD_GLASS: "유리",
  FLD_HVAC: "냉난방",
  FLD_WATERPROOF: "방수",
  FLD_FLOOR: "바닥재",
  FLD_CEILING: "천장",
  FLD_DEMO: "철거",
  FLD_WINDOW: "창호",
  FLD_ELEVATOR: "승강기",
  FLD_LANDSCAPE: "조경",
  FLD_INTERIOR: "인테리어",
  FLD_GENERAL: "종합",
};
