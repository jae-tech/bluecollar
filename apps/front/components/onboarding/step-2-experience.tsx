import { EXPERIENCE_LEVELS } from "@/lib/onboarding-data"
import { Check } from "lucide-react"

interface Step2Props {
  selected: string | undefined
  onSelect: (id: string) => void
}

export function Step2Experience({ selected, onSelect }: Step2Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {"\uD604\uC7A5 \uACBD\uB825\uC740 \uC5BC\uB9C8\uB098 \uB418\uC2E0\uAC00\uC694?"}
        </h1>
        <p className="text-base text-muted-foreground">
          당신의 실제 현장 경력을 선택해주세요.
        </p>
      </div>

      {/* Experience Level Buttons */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = selected === level.id

            return (
              <button
                key={level.id}
                onClick={() => onSelect(level.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                <span className="text-lg font-semibold text-foreground">
                  {level.label}
                </span>

                {isSelected && (
                  <div className="text-primary">
                    <Check size={24} strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
