export const INDUSTRIES = [
  { id: "welding", label: "용접", icon: "Wrench" },
  { id: "electrical", label: "전기", icon: "Zap" },
  { id: "plumbing", label: "배관", icon: "Pipette" },
  { id: "carpentry", label: "목공", icon: "Hammer" },
  { id: "machining", label: "기계가공", icon: "Cog" },
];

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "신입 (배우는 단계)" },
  { id: "junior", label: "1-3년 (조공)" },
  { id: "intermediate", label: "4-7년 (준기공)" },
  { id: "expert", label: "8년 이상 (기공 / 마스터)" },
];

export const SKILL_TAGS: Record<string, string[]> = {
  welding: ["티그용접", "CO2용접", "산소절단", "도면해독", "주강제작"],
  electrical: [
    "분전반 내선",
    "내선 공사",
    "수변전 시공",
    "조명 설치",
    "전자계 수리",
  ],
  plumbing: ["급수시공", "배수연결", "온돌난방", "피팅 설치", "배관 공사"],
  carpentry: ["문 제작", "창틀 설치", "거실패널링", "목재 가공", "캐비넷 제작"],
  machining: ["CNC 가공", "선반", "밀링 가공", "정밀가공", "치구 제작"],
};

export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingData {
  step: OnboardingStep;
  industry?: string;
  experienceLevel?: string;
  skills?: string[];
  images?: File[];
}
