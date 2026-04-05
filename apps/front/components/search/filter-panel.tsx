"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  EXPERIENCE_OPTIONS,
  VERIFICATION_OPTIONS,
  SCALE_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/data";
import { getCodes, type MasterCode } from "@/lib/api";

export interface Filters {
  specialty: string;
  experience: string;
  verification: string;
  scale: string;
  sort: string;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  /** When provided, renders as a mobile drawer with close button */
  onClose?: () => void;
}

function FilterSection({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
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
  );
}

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {
  const [fieldOptions, setFieldOptions] = useState<string[]>(["전체"]);

  useEffect(() => {
    getCodes("FIELD")
      .then((fields: MasterCode[]) => {
        setFieldOptions(["전체", ...fields.map((f) => f.name)]);
      })
      .catch(() => {
        // API 실패 시 기본값 유지
      });
  }, []);

  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <aside className="flex flex-col gap-6 bg-card border border-border rounded-lg p-5 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">필터</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onChange({
                specialty: "전체",
                experience: "전체",
                verification: "모든 워커",
                scale: "전체",
                sort: "인기순",
              })
            }
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            초기화
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="필터 닫기"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-border" />

      <FilterSection
        title="분야 (전문 분야)"
        options={fieldOptions}
        value={filters.specialty}
        onChange={set("specialty")}
      />
      <FilterSection
        title="경력"
        options={EXPERIENCE_OPTIONS}
        value={filters.experience}
        onChange={set("experience")}
      />
      <FilterSection
        title="인증"
        options={VERIFICATION_OPTIONS}
        value={filters.verification}
        onChange={set("verification")}
      />
      <FilterSection
        title="시공 규모"
        options={SCALE_OPTIONS}
        value={filters.scale}
        onChange={set("scale")}
      />

      <div className="w-full h-px bg-border" />

      <FilterSection
        title="정렬"
        options={SORT_OPTIONS}
        value={filters.sort}
        onChange={set("sort")}
      />
    </aside>
  );
}
