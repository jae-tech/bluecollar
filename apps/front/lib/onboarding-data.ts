export const INDUSTRIES = [
  { id: "welding", label: "\uC6A9\uC811", icon: "Wrench" },
  { id: "electrical", label: "\uC804\uAE30", icon: "Zap" },
  { id: "plumbing", label: "\uBC30\uAD00", icon: "Pipette" },
  { id: "carpentry", label: "\uBAA9\uACF5", icon: "Hammer" },
  { id: "machining", label: "\uAE30\uACC4\uAC00\uACF5", icon: "Cog" },
]

export const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "\uC2E0\uC785 (\uB0B0\uC6B0\uB294 \uB2E8\uACC4)" },
  { id: "junior", label: "1-3\uB144 (\uC870\uACF5)" },
  { id: "intermediate", label: "4-7\uB144 (\uC900\uAE30\uACF5)" },
  { id: "expert", label: "8\uB144 \uC774\uC0C1 (\uAE30\uACF5 / \uB9C8\uC2A4\uD130)" },
]

export const SKILL_TAGS: Record<string, string[]> = {
  welding: ["\uD2F0\uC6C0\uC6A9\uC811", "CO2\uC6A9\uC811", "\uC0B0\uC18C\uC808\uB2E8", "\uB3C4\uBA74\uD574\uB3C5", "\uC8FC\uAC15\uC81C\uC791"],
  electrical: ["\uBD84\uC804\uB0A8 \uC8FC\uB0B0", "\uB0B4\uC120 \uC81C\uC2F1", "\uC218\uBA54 \uC2DC\uACF5", "\uC870\uAD3C \uC124\uCE58", "\uC804\uC790\uACC4 \uC218\uB9AC"],
  plumbing: ["\uAE09\uC218\uC2DC\uACF5", "\uC911\uAD6C\uC5F0\uACB0", "\uC88B\uC740\uACB0\uC2DD\uC9C0\uB09C\uB798", "\uD53C\uD305 \uC2A4\uD15C\uB54C\uB2A4", "\uAEE8\uD604\uCBE7"],
  carpentry: ["\uBB38 \uC81C\uC791", "\uC84C\uB09C \uC124\uCE58", "\uAC70\uC6B4\uD328\uB110\uB9C1", "\uB098\uBB34 \uBB35\uD1B5", "\uCE74\uBE44\uB140 \uC81C\uC791"],
  machining: ["CNC \uAC00\uACE0", "\uC120\uBC18", "\uD640\uB798 \uAC00\uACE0", "\uC815\uBC00\uAC00\uACE0", "\uD14C\uD14C \uB9AC\uB4DC"],
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5

export interface OnboardingData {
  step: OnboardingStep
  industry?: string
  experienceLevel?: string
  skills?: string[]
  images?: File[]
  username?: string
}
