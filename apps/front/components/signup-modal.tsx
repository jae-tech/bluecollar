"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { emailSignup, ApiError } from "@/lib/api";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignupModal({ open, onClose }: SignupModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 폼 상태
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // 요청 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ESC 키로 닫기
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

  /** 클라이언트 유효성 검증 */
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
      });
      // 성공 → 이메일 인증 페이지로 이동
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
    `w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
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
      aria-label="회원가입"
    >
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <div className="px-8 py-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="text-brand"
              >
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                워커로 가입하기
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                현장 전문가 계정을 만들고 나만의 포트폴리오를 완성하세요.
              </p>
            </div>
          </div>

          {/* 혜택 목록 */}
          <ul className="flex flex-col gap-2 mb-6">
            {[
              "나만의 프로필 URL (slug.bluecollar.cv)",
              "포트폴리오 사진 업로드",
              "클라이언트와 직접 연결",
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className="text-primary flex-shrink-0"
                />
                <span className="text-sm text-foreground">{perk}</span>
              </li>
            ))}
          </ul>

          {/* 공통 에러 */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 가입 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* 이름 */}
            <div>
              <label
                htmlFor="modal-realname"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                이름
              </label>
              <input
                id="modal-realname"
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
                htmlFor="modal-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                이메일
              </label>
              <input
                id="modal-email"
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
                htmlFor="modal-password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="modal-password"
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
                htmlFor="modal-password-confirm"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="modal-password-confirm"
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
                id="modal-agree"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <label
                htmlFor="modal-agree"
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
              >
                <span className="text-primary font-semibold">이용약관</span>과{" "}
                <span className="text-primary font-semibold">
                  개인정보 처리방침
                </span>
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
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "처리 중..." : "워커로 가입하기"}
            </button>

            {/* 로그인 링크 */}
            <p className="text-xs text-center text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
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
