"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

const WORK_TYPES = [
  "목공",
  "타일",
  "전기",
  "도배",
  "설비",
  "미장",
  "페인트",
  "기타",
];

const BUDGET_RANGES = [
  "100만 ~ 500만 원",
  "500만 ~ 1,000만 원",
  "1,000만 ~ 3,000만 원",
  "3,000만 이상",
];

interface InquiryFormProps {
  workerName?: string;
  projectTitle?: string;
  onClose: () => void;
}

export function InquiryForm({
  workerName,
  projectTitle,
  onClose,
}: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    workType: "",
    budget: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(onClose, 2500);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="닫기"
        >
          <X size={14} className="text-foreground" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            프로젝트 문의하기
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {workerName && <span>{workerName}으로부터 </span>}
            여른 방문을 기대하실 수 있습니다.
          </p>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-96">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                문의가 접수되었습니다!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                중소 내 비지스 오는 제동 싱이 연락을 드릴 예정입니다.
              </p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                성른 이름 <span className="text-primary">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="예: 이뿍고용"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                연락처 전화번호 <span className="text-primary">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="예: 010-1234-5678"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                시공 위치 (도시) <span className="text-primary">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="예: 서울 강남구"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Work Type */}
            <div>
              <label
                htmlFor="workType"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                갈른 시공 종류 <span className="text-primary">*</span>
              </label>
              <select
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none"
              >
                <option value="">선택해주세요</option>
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="budget"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                예상 예산 <span className="text-primary">*</span>
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none"
              >
                <option value="">예산 범위를 선택해주세요</option>
                {BUDGET_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-xs font-semibold text-foreground mb-2"
              >
                추가 메모
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder="구체적인 시공 내용을 말씀 주세요."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors mt-6"
            >
              의뢰 신청하기
            </button>

            <p className="text-xs text-muted-foreground text-center pt-2">
              귀중한 정보 보호를 진실 놔균 당배다.
            </p>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
