import { SKILL_TAGS } from "@/lib/onboarding-data"
import { Check } from "lucide-react"

interface Step3Props {
  industry: string | undefined
  selected: string[]
  onSelect: (skills: string[]) => void
}

export function Step3Skills({ industry, selected, onSelect }: Step3Props) {
  const skillsForIndustry = industry ? SKILL_TAGS[industry] || [] : []

  const toggleSkill = (skill: string) => {
    if (selected.includes(skill)) {
      onSelect(selected.filter((s) => s !== skill))
    } else {
      onSelect([...selected, skill])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {"\uBCF4\uC720\uD558\uC2E0 \uD5EC\uC2EC \uAE30\uC220\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694."}
        </h1>
        <p className="text-base text-muted-foreground">
          {"\uC5EC\uB7EC \uAC1C \uC120\uD0DD \uAac0\uB2A5\uD569\uB2C8\uB2E4."}
        </p>
      </div>

      {/* Skill Tags Cloud */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {skillsForIndustry.map((skill) => {
            const isSelected = selected.includes(skill)

            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2.5 rounded-full border-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  isSelected
                    ? "border-primary bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-muted-foreground/40"
                }`}
              >
                {skill}
                {isSelected && <Check size={16} strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
