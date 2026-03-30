"use client"

import { X } from "lucide-react"
import { SPECIALTIES, EXPERIENCE_OPTIONS, VERIFICATION_OPTIONS, SCALE_OPTIONS, SORT_OPTIONS } from "@/lib/data"

export interface Filters {
  specialty: string
  experience: string
  verification: string
  scale: string
  sort: string
}

interface FilterPanelProps {
  filters: Filters
  onChange: (next: Filters) => void
  /** When provided, renders as a mobile drawer with close button */
  onClose?: () => void
}

function FilterSection({ title, options, value, onChange }: {
  title: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              value === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:text-primary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <aside className="flex flex-col gap-6 bg-card border border-border rounded-2xl p-5 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">{"\uD544\uD130"}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onChange({
                specialty: "\uC804\uCCB4",
                experience: "\uC804\uCCB4",
                verification: "\uBAA8\uB4E0 \uC6CC\uCEE4",
                scale: "\uC804\uCCB4",
                sort: "\uC778\uAE30\uC21C",
              })
            }
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {"\uCD08\uAE30\uD654"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label={"\uD544\uD130 \uB2EB\uAE30"}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-border" />

      <FilterSection title={"\uBD84\uC57C (\uC804\uBB38 \uBD84\uC57C)"} options={SPECIALTIES} value={filters.specialty} onChange={set("specialty")} />
      <FilterSection title={"\uACBD\uB825"} options={EXPERIENCE_OPTIONS} value={filters.experience} onChange={set("experience")} />
      <FilterSection title={"\uC778\uC99D"} options={VERIFICATION_OPTIONS} value={filters.verification} onChange={set("verification")} />
      <FilterSection title={"\uC2DC\uACF5 \uADDC\uBAA8"} options={SCALE_OPTIONS} value={filters.scale} onChange={set("scale")} />

      <div className="w-full h-px bg-border" />

      <FilterSection title={"\uC815\uB82C"} options={SORT_OPTIONS} value={filters.sort} onChange={set("sort")} />
    </aside>
  )
}
