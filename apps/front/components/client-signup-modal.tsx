"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Eye, EyeOff } from "lucide-react";
import { emailSignup, ApiError } from "@/lib/api";

interface ClientSignupModalProps {
  open: boolean;
  onClose: () => void;
  /** 가입 후 복귀할 워커 슬러그 (sessionStorage returnTo 설정용) */
  returnToSlug?: string;
  /** 컨텍스트 배지에 표시할 워커 이름 */
  workerName?: string;
  /** 컨텍스트 배지에 표시할 공종 */
  workType?: string;
}

/**
 * 클라이언트 가입 모달
 *
 * InquiryForm에서 미인증 상태로 의뢰 시도 시 표시.
 * role: 'CLIENT'로 가입하고, 인증 완료 후 워커 프로필로 복귀해
 * 의뢰 폼을 자동으로 열도록 returnTo 흐름을 설정한다.
 *
 * returnTo 흐름:
 *   1) sessionStorage에 returnTo 경로 저장
 *   2) verify-email 페이지로 이동 (email 쿼리파라미터 포함)
 *   3) 인증 완료 후 verify-email이 returnTo로 redirect
 *   4) 워커 프로필 페이지가 ?openInquiry=true 를 감지해 InquiryForm 자동 오픈
 */
export function ClientSignupModal({
  open,
  onClose,
  returnToSlug,
  workerName,
  workType,
}: ClientSignupModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!realName.trim()) errors.realName = "이름을 입력해주세요";
    if (!email) errors.email = "이메일을 입력해주세요";
    if (password.length < 8)
      errors.password = "비밀번호는 8자 이상이어야 합니다";
    if (password !== passwordConfirm)
      errors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    if (!agreeTerms) errors.agreeTerms = "이용약관에 동의해야 합니다";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await emailSignup({
        realName: realName.trim(),
        email,
        password,
        agreeTerms: true,
        role: "CLIENT",
      });

      // 인증 완료 후 복귀할 경로를 sessionStorage에 저장
      if (returnToSlug && typeof window !== "undefined") {
        const returnTo = `/worker/${returnToSlug}?openInquiry=true`;
        sessionStorage.setItem("authReturnTo", returnTo);
      }

      onClose();
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: "이미 가입된 이메일입니다",
          }));
        } else {
          setError(err.message);
        }
      } else {
        setError("알 수 없는 오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-sm border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-500"
        : "border-border focus:border-primary"
    }`;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,27,0.55)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="클라이언트 가입"
    >
      <div className="relative bg-card rounded-sm border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                의뢰하려면 가입이 필요해요
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                무료로 가입하고 전문 시공인에게 바로 의뢰해 보세요.
              </p>
            </div>

            {/* 의뢰 컨텍스트 배지 */}
            {(workerName || workType) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {workerName && (
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-sm">
                    {workerName}
                  </span>
                )}
                {workType && (
                  <span className="text-xs font-medium bg-secondary text-muted-foreground px-2.5 py-1 rounded-sm border border-border">
                    {workType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 공통 에러 */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 가입 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* 이름 */}
            <div>
              <label
                htmlFor="cs-realname"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                이름
              </label>
              <input
                id="cs-realname"
                type="text"
                placeholder="홍길동"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                className={inputClass(!!fieldErrors.realName)}
                autoComplete="name"
              />
              {fieldErrors.realName && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.realName}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label
                htmlFor="cs-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                이메일
              </label>
              <input
                id="cs-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass(!!fieldErrors.email)}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label
                htmlFor="cs-password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="cs-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass(!!fieldErrors.password) + " pr-10"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label
                htmlFor="cs-password-confirm"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="cs-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={
                    inputClass(!!fieldErrors.passwordConfirm) + " pr-10"
                  }
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswordConfirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {fieldErrors.passwordConfirm && (
                <p className="mt-1 text-xs text-destructive">
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>

            {/* 이용약관 동의 */}
            <div className="flex items-start gap-2.5">
              <input
                id="cs-agree"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <label
                htmlFor="cs-agree"
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
              >
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  이용약관
                </Link>
                과{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다
              </label>
            </div>
            {fieldErrors.agreeTerms && (
              <p className="text-xs text-destructive -mt-1">
                {fieldErrors.agreeTerms}
              </p>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-sm hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "처리 중..." : "가입하고 의뢰하기"}
            </button>

            {/* 로그인 링크 */}
            <p className="text-xs text-center text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (returnToSlug && typeof window !== "undefined") {
                    sessionStorage.setItem(
                      "authReturnTo",
                      `/worker/${returnToSlug}?openInquiry=true`,
                    );
                  }
                  router.push("/login");
                }}
                className="text-primary font-semibold hover:underline"
              >
                로그인
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
