"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { FIELD_CODE_LABELS } from "@/lib/field-codes";
import type {
  WorkSchedule,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  ConflictSummary,
} from "@/lib/api";

interface ScheduleModalProps {
  /** null이면 신규 등록, 값이 있으면 수정 */
  schedule: WorkSchedule | null;
  /** 신규 등록 시 초기 날짜 (날짜 클릭 후 모달 오픈) */
  initialDate?: string | null;
  onClose: () => void;
  onSave: (
    payload: CreateSchedulePayload | UpdateSchedulePayload,
  ) => Promise<ConflictSummary[]>;
}

const FIELD_OPTIONS = Object.entries(FIELD_CODE_LABELS);

export function ScheduleModal({
  schedule,
  initialDate,
  onClose,
  onSave,
}: ScheduleModalProps) {
  const isEdit = schedule !== null;

  const [form, setForm] = useState({
    title: schedule?.title ?? "",
    siteAddress: schedule?.siteAddress ?? "",
    fieldCode: schedule?.fieldCode ?? "",
    startDate: schedule?.startDate ?? initialDate ?? "",
    endDate: schedule?.endDate ?? initialDate ?? "",
    memo: schedule?.memo ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictSummary[]>([]);

  // 수정 모드에서 schedule prop 변경 시 폼 초기화
  useEffect(() => {
    if (schedule) {
      setForm({
        title: schedule.title ?? "",
        siteAddress: schedule.siteAddress,
        fieldCode: schedule.fieldCode,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        memo: schedule.memo ?? "",
      });
    }
  }, [schedule]);

  const handleSave = async () => {
    // 클라이언트 검증
    if (!form.siteAddress.trim()) {
      setError("현장 주소를 입력해주세요");
      return;
    }
    if (!form.fieldCode) {
      setError("공정 종류를 선택해주세요");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("시작일과 종료일을 입력해주세요");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("종료일은 시작일보다 같거나 이후여야 합니다");
      return;
    }

    setSaving(true);
    setError(null);
    setConflicts([]);

    try {
      const payload: CreateSchedulePayload | UpdateSchedulePayload = {
        siteAddress: form.siteAddress.trim(),
        fieldCode: form.fieldCode,
        startDate: form.startDate,
        endDate: form.endDate,
        ...(form.title.trim() && { title: form.title.trim() }),
        ...(form.memo.trim() && { memo: form.memo.trim() }),
      };

      const returned = await onSave(payload);
      setConflicts(returned);

      if (returned.length === 0) {
        // 충돌 없음 → 모달 닫기
        onClose();
      }
      // 충돌 있어도 저장은 완료됨 — 사용자가 확인 후 닫기
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 패널 */}
      <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 z-10 max-h-[90dvh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-foreground">
            {isEdit ? "일정 수정" : "일정 추가"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* 현장 주소 (필수) */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              현장 주소 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.siteAddress}
              onChange={(e) =>
                setForm((f) => ({ ...f, siteAddress: e.target.value }))
              }
              placeholder="예: 서울 강남구 삼성동 123"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* 공정 종류 (필수) */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              공정 <span className="text-destructive">*</span>
            </label>
            <select
              value={form.fieldCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, fieldCode: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            >
              <option value="">공정 선택</option>
              {FIELD_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 시작일 / 종료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                시작일 <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                종료일 <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                min={form.startDate || undefined}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* 작업명 (선택) */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              작업명{" "}
              <span className="text-muted-foreground text-xs">(선택)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="예: 욕실 타일 시공"
              maxLength={100}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* 메모 (선택) */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              메모 <span className="text-muted-foreground text-xs">(선택)</span>
            </label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
              placeholder="특이사항, 연락처 등"
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* 에러 */}
          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* 충돌 경고 */}
          {conflicts.length > 0 && (
            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 flex gap-2">
              <AlertTriangle
                size={15}
                className="text-orange-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-medium text-orange-700">
                  일정이 겹칩니다 (등록은 완료됨)
                </p>
                <ul className="mt-1 space-y-0.5">
                  {conflicts.map((c) => (
                    <li key={c.id} className="text-xs text-orange-600">
                      {c.title ?? "일정"}: {c.startDate} ~ {c.endDate}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {saving ? "저장 중..." : isEdit ? "수정" : "등록"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {conflicts.length > 0 ? "닫기" : "취소"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
