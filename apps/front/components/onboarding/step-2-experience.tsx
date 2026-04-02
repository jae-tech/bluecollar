"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getCodes, type MasterCode } from "@/lib/api";

interface Step2Props {
  selected: string | undefined;
  onSelect: (code: string) => void;
}

export function Step2Experience({ selected, onSelect }: Step2Props) {
  const [expLevels, setExpLevels] = useState<MasterCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCodes("EXP")
      .then(setExpLevels)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          현장 경력은 얼마나 되신가요?
        </h1>
        <p className="text-base text-muted-foreground">
          당신의 실제 현장 경력을 선택해주세요.
        </p>
      </div>

      {/* Experience Level Buttons */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : (
          <div className="space-y-3">
            {expLevels.map((level) => {
              const isSelected = selected === level.code;

              return (
                <button
                  key={level.code}
                  onClick={() => onSelect(level.code)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="text-lg font-semibold text-foreground">
                    {level.name}
                  </span>

                  {isSelected && (
                    <div className="text-primary">
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
