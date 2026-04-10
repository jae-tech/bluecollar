// ── 공간 유형 레이블 ──────────────────────────────────────────────────────────
export const SPACE_TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL: "주거",
  COMMERCIAL: "상업",
  OTHER: "기타",
};

// ── 비용 범위 옵션 ──────────────────────────────────────────────────────────────
// estimatedValue: 해당 범위의 대표값 (원 단위). 열린 범위는 최솟값 사용.
export const COST_OPTIONS = [
  { label: "300만원 미만", estimatedValue: 1_500_000 },
  { label: "300~500만원", estimatedValue: 4_000_000 },
  { label: "500~1000만원", estimatedValue: 7_500_000 },
  { label: "1000~2000만원", estimatedValue: 15_000_000 },
  { label: "2000~3000만원", estimatedValue: 25_000_000 },
  { label: "3000~5000만원", estimatedValue: 40_000_000 },
  { label: "5000만원~1억", estimatedValue: 75_000_000 },
  { label: "1억 이상", estimatedValue: 100_000_000 },
] as const;

// ── 자재 카테고리 ──────────────────────────────────────────────────────────────
export const MATERIAL_CATEGORIES = [
  "바닥재",
  "벽재",
  "천장재",
  "타일",
  "도배",
  "줄눈/접착제",
  "페인트",
  "조명",
  "창호",
  "위생도기",
  "전기자재",
  "배관자재",
  "기타",
] as const;

// ── 난이도 옵션 ────────────────────────────────────────────────────────────────
export const DIFFICULTY_OPTIONS = [
  { label: "소규모 (1~2개 공간)", value: "EASY" as const },
  { label: "중규모 (3~5개 공간)", value: "MEDIUM" as const },
  { label: "대규모 (전체 리모델링)", value: "HARD" as const },
];
