"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 이 날짜 이전은 선택 불가 */
  minDate?: Date;
  /** 이 날짜 이후는 선택 불가 */
  maxDate?: Date;
}

/**
 * DESIGN.md 기반 DatePicker
 * - 트리거: border-border, radius-sm 인풋 스타일
 * - 캘린더: react-day-picker 기반 Calendar 컴포넌트
 * - primary: #292524 (Deep Stone)
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // 날짜 파싱 — T00:00:00 suffix로 로컬 기준 midnight 보장 (UTC offset 방지)
  const selected = React.useMemo(
    () => (value ? new Date(value + "T00:00:00") : undefined),
    [value],
  );

  const formatted = React.useMemo(
    () =>
      selected
        ? selected.toLocaleDateString("ko-KR", DATE_FORMAT_OPTIONS)
        : null,
    [selected],
  );

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      // YYYY-MM-DD 형태로 로컬 기준 변환
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
      setOpen(false);
    },
    [onChange],
  );

  const handleClear = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();
      onChange("");
    },
    [onChange],
  );

  // minDate/maxDate 비활성화 predicate — 매 렌더마다 새 함수 생성 방지
  const isDisabled = React.useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [minDate, maxDate],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm transition-colors",
            "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !formatted && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <CalendarIcon
              size={15}
              className={cn(
                "flex-shrink-0 transition-colors",
                formatted ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span className="truncate">{formatted ?? placeholder}</span>
          </span>
          {formatted && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClear(e);
              }}
              className="flex-shrink-0 p-0.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="날짜 지우기"
            >
              <X size={13} />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-border shadow-none"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={isDisabled}
          captionLayout="label"
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
