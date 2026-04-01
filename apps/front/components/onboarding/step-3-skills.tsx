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
          보유하신 핵심 기술을 선택해주세요.
        </h1>
        <p className="text-base text-muted-foreground">
          여러 개 선택 가능합니다.
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
