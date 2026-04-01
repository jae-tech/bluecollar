import { INDUSTRIES } from "@/lib/onboarding-data"
import { Check, Wrench, Zap, Pipette, Hammer, Cog } from "lucide-react"

const ICON_MAP = {
  Wrench,
  Zap,
  Pipette,
  Hammer,
  Cog,
}

interface Step1Props {
  selected: string | undefined
  onSelect: (id: string) => void
}

export function Step1Industry({ selected, onSelect }: Step1Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          어떤 분야의 베테랑이신가요?
        </h1>
        <p className="text-base text-muted-foreground">
          {"\uAC00\uC7A5 \uC8FC\uB825\uC73C\uB85C \uD558\uC2DC\uB294 \uC77C \uD558\uB098\uB9CC \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
        </p>
      </div>

      {/* Occupation Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {INDUSTRIES.map((industry) => {
            const Icon = ICON_MAP[industry.icon as keyof typeof ICON_MAP]
            const isSelected = selected === industry.id

            return (
              <button
                key={industry.id}
                onClick={() => onSelect(industry.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {Icon && <Icon size={20} />}
                </div>

                {/* Label */}
                <span
                  className={`flex-1 text-left text-lg font-semibold ${
                    isSelected ? "text-foreground" : "text-foreground"
                  }`}
                >
                  {industry.label}
                </span>

                {/* Checkmark */}
                {isSelected && (
                  <div className="flex-shrink-0 text-primary">
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
