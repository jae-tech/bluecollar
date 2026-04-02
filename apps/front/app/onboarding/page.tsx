"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/onboarding/progress-bar";
import { Step1Industry } from "@/components/onboarding/step-1-industry";
import { Step2Experience } from "@/components/onboarding/step-2-experience";
import { Step3Skills } from "@/components/onboarding/step-3-skills";
import { Step4Portfolio } from "@/components/onboarding/step-4-portfolio";
import type { OnboardingStep, OnboardingData } from "@/lib/onboarding-data";
import { completeOnboarding, getMyWorkerProfile, ApiError } from "@/lib/api";

const TOTAL_STEPS = 4;

// 경험 레벨 ID → yearsOfExperience 매핑
const EXPERIENCE_TO_YEARS: Record<string, number> = {
  beginner: 0,
  junior: 2,
  intermediate: 5,
  expert: 10,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>({
    step: 1,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNext = useCallback(async () => {
    if (data.step < TOTAL_STEPS) {
      setData((prev) => ({
        ...prev,
        step: (prev.step + 1) as OnboardingStep,
      }));
    } else {
      // 온보딩 완료 → API 호출
      setSubmitLoading(true);
      setSubmitError(null);
      try {
        // 프론트 industry ID → DB field code 변환 (추후 API에서 코드 목록을 가져올 예정)
        const fieldCodeMap: Record<string, string> = {
          welding: "FLD_WELDING",
          electrical: "FLD_ELECTRIC",
          plumbing: "FLD_PLUMBING",
          carpentry: "FLD_CARPENTRY",
          machining: "FLD_MACHINING",
        };
        // 이미 /onboarding/slug에서 생성된 프로필의 slug 조회
        const existing = await getMyWorkerProfile();
        const profile = await completeOnboarding({
          slug: existing?.slug ?? "",
          businessName: existing?.slug ?? "",
          fieldCodes: data.industry
            ? [fieldCodeMap[data.industry] ?? data.industry]
            : [],
          yearsOfExperience:
            EXPERIENCE_TO_YEARS[data.experienceLevel ?? "beginner"] ?? 0,
          areaCodes: [],
        });
        router.push(`/onboarding/complete`);
      } catch (err) {
        if (err instanceof ApiError) {
          setSubmitError(err.message);
        } else {
          setSubmitError(
            "프로필 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
          );
        }
        setSubmitLoading(false);
      }
    }
  }, [data, router]);

  const handleBack = () => {
    if (data.step > 1) {
      setData((prev) => ({
        ...prev,
        step: (prev.step - 1) as OnboardingStep,
      }));
    }
  };

  const isNextDisabled = () => {
    switch (data.step) {
      case 1:
        return !data.industry;
      case 2:
        return !data.experienceLevel;
      case 3:
        return data.skills?.length === 0;
      case 4:
        return false; // Portfolio is optional (can skip)
      default:
        return true;
    }
  };

  return (
    <>
      {/* Progress Bar */}
      <ProgressBar currentStep={data.step} totalSteps={TOTAL_STEPS} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Steps with Framer Motion */}
        <AnimatePresence mode="wait">
          {data.step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step1Industry
                selected={data.industry}
                onSelect={(id) => {
                  setData((prev) => ({ ...prev, industry: id }));
                  // Auto-advance to next step after selection
                  setTimeout(() => handleNext(), 300);
                }}
              />
            </motion.div>
          )}
          {data.step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step2Experience
                selected={data.experienceLevel}
                onSelect={(id) =>
                  setData((prev) => ({ ...prev, experienceLevel: id }))
                }
              />
            </motion.div>
          )}
          {data.step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step3Skills
                industry={data.industry}
                selected={data.skills || []}
                onSelect={(skills) => setData((prev) => ({ ...prev, skills }))}
              />
            </motion.div>
          )}
          {data.step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step4Portfolio
                images={data.images || []}
                onImagesSelect={(images) =>
                  setData((prev) => ({ ...prev, images }))
                }
                onSkip={() => {
                  setData((prev) => ({ ...prev, images: [] }));
                  handleNext();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 flex flex-col gap-2">
        {submitError && (
          <p className="text-sm text-red-500 text-center">{submitError}</p>
        )}
        <div className="flex gap-3">
          {data.step > 1 && (
            <button
              onClick={handleBack}
              disabled={submitLoading}
              className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-bold hover:bg-secondary transition-colors disabled:opacity-50"
            >
              뒤로
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isNextDisabled() || submitLoading}
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              isNextDisabled() || submitLoading
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            }`}
          >
            {submitLoading && (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            )}
            {data.step === TOTAL_STEPS ? "완료" : "다음"}
          </button>
        </div>
      </div>

      {/* Bottom Padding to Account for Fixed Controls */}
      <div className="h-24" />
    </>
  );
}
