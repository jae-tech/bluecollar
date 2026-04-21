"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Wrench,
  Zap,
  Hammer,
  Pipette,
  ShieldCheck,
  Paintbrush,
  Square,
  BookOpen,
  Layers,
  UtensilsCrossed,
  Wind,
  Bath,
  Sparkles,
  Glasses,
  Flame,
  Cog,
  Droplets,
  Sofa,
  AirVent,
  BrickWall,
} from "lucide-react";
import { getCodes, type MasterCode } from "@/lib/api";

// 업종 코드별 아이콘 매핑
const FIELD_ICON_MAP: Record<string, React.ElementType> = {
  FLD_DEMOLITION: Hammer,
  FLD_WINDOW: Glasses,
  FLD_PLUMBING: Pipette,
  FLD_WATERPROOF: Droplets,
  FLD_ELECTRIC: Zap,
  FLD_CARPENTRY: Layers,
  FLD_FILM: Square,
  FLD_PAINTING: Paintbrush,
  FLD_TILE: BookOpen,
  FLD_WALLPAPER: Layers,
  FLD_FLOORING: Square,
  FLD_KITCHEN: UtensilsCrossed,
  FLD_ELASTIC_COAT: Wind,
  FLD_BATHROOM: Bath,
  FLD_CLEANING: Sparkles,
  FLD_GLAZING: Glasses,
  FLD_WELDING: Flame,
  FLD_MACHINING: Cog,
  // 견적서 기준 추가 직종 (2026-04-21)
  FLD_PLASTER: BrickWall,
  FLD_HVAC: AirVent,
  FLD_FURNITURE: Sofa,
};

interface Step1Props {
  selected: string | undefined;
  onSelect: (code: string) => void;
}

export function Step1Industry({ selected, onSelect }: Step1Props) {
  const [fields, setFields] = useState<MasterCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCodes("FIELD")
      .then(setFields)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          어떤 분야의 베테랑이신가요?
        </h1>
        <p className="text-base text-muted-foreground">
          가장 주력으로 하시는 일 하나만 선택해 주세요.
        </p>
      </div>

      {/* Occupation Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => {
              const Icon = FIELD_ICON_MAP[field.code] ?? Wrench;
              const isSelected = selected === field.code;

              return (
                <button
                  key={field.code}
                  onClick={() => onSelect(field.code)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-left text-lg font-semibold text-foreground">
                    {field.name}
                  </span>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="flex-shrink-0 text-primary">
                      <Check size={24} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
