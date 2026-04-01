"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import {
  getMyWorkerProfile,
  checkSlugAvailability,
  completeOnboarding,
  ApiError,
} from "@/lib/api";

/** slug 입력값 유효성 검사 (영문 소문자, 숫자, 하이픈, 3자 이상) */
function isValidFormat(str: string): boolean {
  return /^[a-z0-9-]{3,}$/.test(str);
}

export default function OnboardingSlugPage() {
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guardChecked, setGuardChecked] = useState(false);

  // 재접근 가드: 이미 workerProfileId 있으면 프로필 페이지로
  useEffect(() => {
    getMyWorkerProfile().then((profile) => {
      if (profile) {
        router.replace(`/worker/${profile.slug}`);
      } else {
        setGuardChecked(true);
      }
    });
  }, [router]);

  // slug 변경 시 실제 API로 중복 확인
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setStatus("idle");
      return;
    }
    if (!isValidFormat(slug)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const available = await checkSlugAvailability(slug);
        setStatus(available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  /** slug 설정 후 /onboarding으로 이동 */
  const handleSubmit = useCallback(async () => {
    if (status !== "available" || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        slug,
        businessName: slug,
        fieldCodes: [],
      });
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStatus("taken");
        setSubmitError("이미 사용 중인 주소입니다. 다른 주소를 선택해주세요.");
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("오류가 발생했습니다. 다시 시도해주세요.");
      }
      setSubmitLoading(false);
    }
  }, [slug, status, submitLoading, router]);

  /** "나중에" 버튼: slug 없이 /onboarding으로 이동 */
  const handleSkip = () => {
    router.push("/onboarding");
  };

  if (!guardChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-sm font-semibold text-primary mb-2">첫 번째 단계</p>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          나만의 기술 명함 주소를 정해주세요.
        </h1>
        <p className="text-base text-muted-foreground">
          주소는 가입 후 변경이 불가능합니다.
        </p>
      </div>

      {/* 입력 영역 */}
      <div className="flex-1 px-6 pb-6">
        <div className="space-y-4">
          {/* URL 미리보기 */}
          <div className="bg-secondary rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-2">
              개인 프로필 주소
            </p>
            <p className="text-lg font-semibold text-foreground break-words">
              <span className="text-muted-foreground">worker.cv/ </span>
              <span className="text-primary">{slug || "_"}</span>
            </p>
          </div>

          {/* 입력 필드 */}
          <div>
            <label
              htmlFor="slug-input"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              영문 소문자, 숫자, 하이픈(-)만 사용 가능
            </label>
            <input
              id="slug-input"
              type="text"
              value={slug}
              onChange={(e) => {
                const value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "");
                setSlug(value);
              }}
              placeholder="yourname"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none text-lg bg-card text-foreground ${
                status === "available"
                  ? "border-primary/50 focus:border-primary"
                  : status === "taken" || status === "invalid"
                    ? "border-destructive/50 focus:border-destructive"
                    : "border-border focus:border-primary"
              }`}
            />
          </div>

          {/* 상태 메시지 */}
          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl ${
                status === "available"
                  ? "bg-green-50 border border-green-300"
                  : status === "taken" || status === "invalid"
                    ? "bg-red-50 border border-red-300"
                    : "bg-secondary border border-border"
              }`}
            >
              {status === "checking" && (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">확인 중...</p>
                </>
              )}
              {status === "available" && (
                <>
                  <Check size={18} className="text-primary flex-shrink-0" />
                  <p className="text-sm text-primary">
                    사용 가능한 주소입니다!
                  </p>
                </>
              )}
              {status === "taken" && (
                <>
                  <AlertCircle
                    size={18}
                    className="text-destructive flex-shrink-0"
                  />
                  <p className="text-sm text-destructive">
                    이미 사용 중인 주소입니다.
                  </p>
                </>
              )}
              {status === "invalid" && (
                <>
                  <AlertCircle
                    size={18}
                    className="text-orange-600 flex-shrink-0"
                  />
                  <p className="text-sm text-orange-700">
                    영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.
                  </p>
                </>
              )}
            </div>
          )}

          {/* 주의 안내 */}
          <div className="bg-secondary rounded-xl p-4 border border-border flex items-start gap-2.5">
            <AlertCircle
              size={14}
              className="text-muted-foreground flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-muted-foreground">
              <strong>중요:</strong> 주소는 가입 후 변경이 불가능합니다.
              신중하게 선택해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 flex flex-col gap-2">
        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={submitLoading}
            className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status !== "available" || submitLoading}
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              status !== "available" || submitLoading
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            }`}
          >
            {submitLoading && (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            )}
            주소 확정하기
          </button>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-24" />
    </div>
  );
}
