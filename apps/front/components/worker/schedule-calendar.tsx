"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkSchedule } from "@/lib/api";

interface ScheduleCalendarProps {
  year: number;
  month: number;
  schedules: WorkSchedule[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/** YYYY-MM-DD 형식의 날짜 셋 생성 (start~end 범위) */
function buildDateSet(schedules: WorkSchedule[]): Set<string> {
  const set = new Set<string>();
  for (const s of schedules) {
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    const cur = new Date(start);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      set.add(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function ScheduleCalendar({
  year,
  month,
  schedules,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: ScheduleCalendarProps) {
  // 해당 월 첫날 요일(0=일)과 마지막날
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // 일정 있는 날짜 셋
  const scheduledDates = buildDateSet(schedules);

  // 달력 셀 배열 (null = 빈 칸)
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // 7의 배수로 패딩
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-card border border-border rounded-md overflow-hidden">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="이전 달"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {year}년 {month}월
        </p>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="다음 달"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${
              i === 0
                ? "text-red-400"
                : i === 6
                  ? "text-blue-400"
                  : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-11" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasSchedule = scheduledDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const isSun = idx % 7 === 0;
          const isSat = idx % 7 === 6;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              // 터치 타깃 최소 44px (min-h-[44px])
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors relative
                ${isSelected ? "bg-primary/10" : "hover:bg-secondary"}
                ${isToday ? "font-bold" : ""}
              `}
              aria-label={`${month}월 ${day}일${hasSchedule ? ", 일정 있음" : ""}`}
            >
              <span
                className={`text-xs ${
                  isSelected
                    ? "text-primary font-semibold"
                    : isToday
                      ? "text-primary"
                      : isSun
                        ? "text-red-400"
                        : isSat
                          ? "text-blue-400"
                          : "text-foreground"
                }`}
              >
                {day}
              </span>
              {/* 일정 dot */}
              {hasSchedule && (
                <span className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
