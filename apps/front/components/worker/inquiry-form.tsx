"use client";

import { useState } from "react";
import { X, CheckCircle, ChevronDown, Loader2 } from "lucide-react";
import { submitInquiry } from "@/lib/api";

interface InquiryFormProps {
  open: boolean;
  onClose: () => void;
  workerSlug: string;
  workerName: string;
  projectTitle?: string;
}

const WORK_TYPES = [
  "목공 / 빌트인",
  "타일 시공",
  "전기 공사",
  "도배 / 벽지",
  "설비 공사",
  "미장 / 페인트",
  "인테리어 전체",
  "기타",
];

const BUDGET_RANGES = [
  "100만원 이하",
  "100 ~ 300만원",
  "300 ~ 500만원",
  "500만 ~ 1천만원",
  "1천만 ~ 3천만원",
  "3천만원 이상",
  "컨설팅을 받고 싶음",
];

export function InquiryForm({
  open,
  onClose,
  workerSlug,
  workerName,
  projectTitle,
}: InquiryFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    workType: "",
    budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next: Partial<typeof form> = {};
    if (!form.name.trim()) next.name = "이름을 입력해 주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해 주세요.";
    if (!form.location.trim()) next.location = "시공 위치를 입력해 주세요.";
    if (!form.workType) next.workType = "공종을 선택해 주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      await submitInquiry(workerSlug, {
        name: form.name,
        phone: form.phone,
        location: form.location,
        workType: form.workType,
        budget: form.budget || undefined,
        message: form.message || undefined,
        projectTitle,
      });
      setSubmitted(true);
    } catch {
      setApiError(
        "의뢰 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setForm({
        name: "",
        phone: "",
        location: "",
        workType: "",
        budget: "",
        message: "",
      });
      setErrors({});
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="의뢰 양식"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full md:max-w-lg bg-card rounded-t-sm md:rounded-sm border border-border overflow-hidden max-h-[96dvh] flex flex-col"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {submitted ? "의뢰가 접수되었습니다" : "시공 의뢰하기"}
            </h2>
            {!submitted && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectTitle
                  ? `"${projectTitle}" 기반 의뢰`
                  : `${workerName} 에게 물어보세요`}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-sm border border-border flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="닫기"
          >
            <X size={14} className="text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center text-center px-8 py-14 gap-5">
              <div className="w-16 h-16 rounded-sm bg-secondary border border-border flex items-center justify-center">
                <CheckCircle size={30} className="text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground mb-2">
                  {workerName}님께 의뢰가 전달되었습니다
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  연락처로 빠른 시간 안에 안내드리겠습니다.{"\n"}조금만 기다려
                  주세요.
                </p>
              </div>
              <div className="w-full h-px bg-border" />
              <div className="w-full flex flex-col gap-2 text-sm text-left bg-secondary border border-border rounded-sm p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">시공 위치</span>
                  <span className="font-medium text-foreground">
                    {form.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">공종</span>
                  <span className="font-medium text-foreground">
                    {form.workType}
                  </span>
                </div>
                {form.budget && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예산</span>
                    <span className="font-medium text-foreground">
                      {form.budget}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-sm bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                확인
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form
              onSubmit={handleSubmit}
              noValidate
              className="px-6 py-6 flex flex-col gap-5"
            >
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  이름 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="홍길동"
                  className={`w-full px-4 py-3.5 rounded-sm border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.name ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  연락처 (휴대폰) <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="010-0000-0000"
                  className={`w-full px-4 py-3.5 rounded-sm border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.phone ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  시공 위치 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={set("location")}
                  placeholder="서울시 강남구 아파트 도명수 길 123"
                  className={`w-full px-4 py-3.5 rounded-sm border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${errors.location ? "border-red-400" : "border-border focus:border-primary"}`}
                />
                {errors.location && (
                  <p className="text-xs text-red-500">{errors.location}</p>
                )}
              </div>

              {/* Work type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  공종 <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.workType}
                    onChange={set("workType")}
                    className={`w-full appearance-none px-4 py-3.5 pr-10 rounded-sm border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${form.workType ? "text-foreground" : "text-muted-foreground"} ${errors.workType ? "border-red-400" : "border-border focus:border-primary"}`}
                  >
                    <option value="" disabled>
                      공종을 선택해 주세요
                    </option>
                    {WORK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
                {errors.workType && (
                  <p className="text-xs text-red-500">{errors.workType}</p>
                )}
              </div>

              {/* Budget */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  예산 범위 (선택)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_RANGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          budget: prev.budget === b ? "" : b,
                        }))
                      }
                      className={`px-3 py-2.5 rounded-sm border text-xs font-medium transition-all text-left ${form.budget === b ? "bg-primary/10 border-primary text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  추가 문의 내용 (선택)
                </label>
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  rows={3}
                  placeholder="원하시는 디자인, 참고 사진, 시공 시작 희망 일정 등을 자유롭게 적어주세요."
                  className="w-full px-4 py-3.5 rounded-sm border border-border text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* API 에러 */}
              {apiError && (
                <p className="text-xs text-red-500 text-center -mb-1">
                  {apiError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all mt-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    접수 중...
                  </>
                ) : (
                  "의뢰 요청하기"
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center -mt-2">
                제출하실 경우 개인정보 처리방침에 동의하는 것으로 간주합니다.
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
