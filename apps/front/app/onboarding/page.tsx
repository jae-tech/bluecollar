"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ProgressBar } from "@/components/onboarding/progress-bar"
import { Step1Industry } from "@/components/onboarding/step-1-industry"
import { Step2Experience } from "@/components/onboarding/step-2-experience"
import { Step3Skills } from "@/components/onboarding/step-3-skills"
import { Step4Portfolio } from "@/components/onboarding/step-4-portfolio"
import { Step5Username } from "@/components/onboarding/step-5-username"
import type { OnboardingStep, OnboardingData } from "@/lib/onboarding-data"

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData>({
    step: 1,
  })

  const handleNext = useCallback(async () => {
    if (data.step < TOTAL_STEPS) {
      setData((prev) => ({
        ...prev,
        step: (prev.step + 1) as OnboardingStep,
      }))
    } else {
      // Submit onboarding data
      console.log("\uC628\ubcf4\ub529 \ub370\uc774\ud130:", data)
      // TODO: Send to API
    }
  }, [data])

  const handleBack = () => {
    if (data.step > 1) {
      setData((prev) => ({
        ...prev,
        step: (prev.step - 1) as OnboardingStep,
      }))
    }
  }

  const isNextDisabled = () => {
    switch (data.step) {
      case 1:
        return !data.industry
      case 2:
        return !data.experienceLevel
      case 3:
        return data.skills?.length === 0
      case 4:
        return false // Portfolio is optional (can skip)
      case 5:
        return !data.username || data.username.length < 3
      default:
        return true
    }
  }

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
                  setData((prev) => ({ ...prev, industry: id }))
                  // Auto-advance to next step after selection
                  setTimeout(() => handleNext(), 300)
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
                onSelect={(id) => setData((prev) => ({ ...prev, experienceLevel: id }))}
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
                onImagesSelect={(images) => setData((prev) => ({ ...prev, images }))}
                onSkip={() => {
                  setData((prev) => ({ ...prev, images: [], step: 5 as OnboardingStep }))
                }}
              />
            </motion.div>
          )}
          {data.step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Step5Username
                username={data.username}
                onUsernameChange={(username) => setData((prev) => ({ ...prev, username }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 flex gap-3">
        {data.step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-bold hover:bg-secondary transition-colors"
          >
            {"\uB4A4\uB85C"}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={isNextDisabled()}
          className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-200 ${
            isNextDisabled()
              ? "bg-secondary text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          }`}
        >
          {data.step === TOTAL_STEPS ? "\uC644\ub8cc" : "\ub2e4\uc74c"}
        </button>
      </div>

      {/* Bottom Padding to Account for Fixed Controls */}
      <div className="h-24" />
    </>
  )
}
