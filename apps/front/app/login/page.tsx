"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { login, getMyWorkerProfile, ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password });

      if (res.requiresEmailVerification && res.email) {
        // 이메일 미인증 → 인증 페이지로
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(res.email)}`,
        );
        return;
      }

      // 로그인 성공 → 워커 프로필 확인
      try {
        const profile = await getMyWorkerProfile();
        if (profile?.slug) {
          router.push("/dashboard");
        } else {
          // 프로필 없거나 slug 미설정 → slug 선택 단계부터
          router.push("/onboarding/slug");
        }
      } catch {
        // 프로필 조회 실패 시에도 slug 설정 단계로
        router.push("/onboarding/slug");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다");
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
    `w-full px-4 py-3 rounded-md border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
      hasError ? "border-red-500" : "border-border focus:border-primary"
    }`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <Logo className="text-2xl font-bold tracking-tight text-foreground" />
          </a>
        </div>

        <div className="bg-card rounded-lg border border-border px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">로그인</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              계속하려면 로그인해주세요
            </p>
          </div>

          {/* 소셜 로그인 */}
          <div className="flex flex-col gap-3 mb-5">
            <a
              href={`${API_URL}/auth/login/google`}
              className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-md border border-border bg-background hover:bg-secondary text-sm font-medium text-foreground transition-colors"
            >
              {/* Google 아이콘 */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
                />
                <path
                  fill="#34A853"
                  d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"
                />
                <path
                  fill="#EA4335"
                  d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"
                />
              </svg>
              Google로 계속하기
            </a>
            <a
              href={`${API_URL}/auth/login/kakao`}
              className="flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-md border border-border bg-[#FEE500] hover:bg-[#F0D900] text-sm font-medium text-[#3C1E1E] transition-colors"
            >
              {/* 카카오 아이콘 */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.38c0 2.1 1.38 3.93 3.45 4.98l-.87 3.24c-.09.3.24.54.51.36L8.19 13.5c.27.03.54.03.81.03 4.14 0 7.5-2.64 7.5-5.88C16.5 4.14 13.14 1.5 9 1.5z"
                  fill="#3C1E1E"
                />
              </svg>
              카카오로 계속하기
            </a>
          </div>

          {/* 구분선 */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">
                또는 이메일로 로그인
              </span>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* 이메일 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass()}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass() + " pr-10"}
                  autoComplete="current-password"
                  required
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-md hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 가입 링크 */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            아직 계정이 없으신가요?{" "}
            <button
              type="button"
              onClick={() => router.push("/?signup=1")}
              className="text-primary font-semibold hover:underline"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
