export type OnboardingStep = 1 | 2 | 3 | 4;

export interface OnboardingData {
  step: OnboardingStep;
  industry?: string;
  experienceLevel?: string;
  skills?: string[];
  images?: File[];
}
