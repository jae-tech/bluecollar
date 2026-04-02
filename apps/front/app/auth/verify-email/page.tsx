"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OTPInput, SlotProps } from "input-otp";
import { CheckCircle2, RefreshCw, Mail } from "lucide-react";
import { verifyEmailCode, resendVerificationEmail, ApiError } from "@/lib/api";

function OTPSlot({ char, hasFakeCaret, isActive }: SlotProps) {
  return (
    <div
      className={`relative w-12 h-14 flex items-center justify-center text-xl font-bold rounded-xl border-2 transition-all ${
        isActive
          ? "border-primary bg-primary/5 text-foreground"
          : char
            ? "border-border bg-card text-foreground"
            : "border-border bg-card text-muted-foreground"
      }`}
    >
      {char ?? <span className="text-muted-foreground/40">·</span>}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-6 bg-primary animate-caret-blink" />
        </div>
      )}
    </div>
  );
}

const RESEND_COOLDOWN = 60; // 초

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 이메일 없으면 홈으로
  useEffect(() => {
    if (!email) router.replace("/");
  }, [email, router]);

  // 쿨다운 타이머 정리
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /** OTP 6자리 입력 완료 시 자동 제출 */
  const handleComplete = async (value: string) => {
    setVerifyError(null);
    setLoading(true);
    try {
      await verifyEmailCode({ email, code: value, type: "SIGNUP" });
      // 인증 성공 → slug 설정 페이지로 이동 (slug 페이지에서 재방문자 가드 처리)
      router.push("/onboarding/slug");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401) {
          setVerifyError("인증 코드가 올바르지 않거나 만료되었습니다");
        } else {
          setVerifyError(err.message);
        }
      } else {
        setVerifyError("알 수 없는 오류가 발생했습니다");
      }
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setVerifyError(null);
    try {
      await resendVerificationEmail(email);
      setResendSuccess(true);
      startCooldown();
    } catch (err) {
      if (err instanceof ApiError) {
        setVerifyError(err.message);
      } else {
        setVerifyError("재발송 중 오류가 발생했습니다");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 카드 */}
        <div className="bg-card rounded-2xl border border-border shadow-2xl px-8 py-10">
          {/* 헤더 */}
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                이메일 인증
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                <span className="font-semibold text-foreground">{email}</span>
                으로
                <br />
                발송된 6자리 코드를 입력해주세요
              </p>
            </div>
          </div>

          {/* OTP 입력 */}
          <div className="flex flex-col items-center gap-4">
            <OTPInput
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleComplete}
              disabled={loading}
              render={({ slots }) => (
                <div className="flex gap-2">
                  {slots.map((slot, i) => (
                    <OTPSlot key={i} {...slot} />
                  ))}
                </div>
              )}
            />

            {/* 에러 메시지 */}
            {verifyError && (
              <p className="text-sm text-destructive text-center">
                {verifyError}
              </p>
            )}

            {/* 로딩 상태 */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                인증 중...
              </div>
            )}

            {/* 재발송 성공 메시지 */}
            {resendSuccess && !verifyError && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 size={14} />새 코드가 발송되었습니다
              </div>
            )}
          </div>

          {/* 재발송 */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              코드를 받지 못하셨나요?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed transition-opacity"
            >
              <RefreshCw
                size={14}
                className={resendLoading ? "animate-spin" : ""}
              />
              {resendCooldown > 0
                ? `${resendCooldown}초 후 재발송 가능`
                : resendLoading
                  ? "발송 중..."
                  : "인증 코드 재발송"}
            </button>
          </div>

          {/* 다른 이메일로 가입 */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              다른 이메일로 돌아가기
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          스팸 폴더도 확인해보세요. 코드는 10분간 유효합니다.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
