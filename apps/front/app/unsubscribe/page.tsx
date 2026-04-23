"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Status = "idle" | "loading" | "success" | "error";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // 이메일 파라미터가 있으면 자동으로 수신 거부 처리
  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/email/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage(email);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(data.message || "처리 중 오류가 발생했습니다.");
      }
    } catch {
      setStatus("error");
      setMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-[#E5E0DB] rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-[#E5E0DB]">
          <Logo className="text-base" />
        </div>

        {/* 본문 */}
        <div className="px-8 py-10 text-center">
          {status === "idle" && !email && (
            <>
              <div className="text-2xl mb-3">✉️</div>
              <h1 className="text-lg font-700 text-[#1C1917] mb-2">
                이메일 수신 거부
              </h1>
              <p className="text-sm text-[#6B5E57] leading-relaxed">
                수신 거부할 이메일 주소가 없습니다.
                <br />
                이메일의 수신 거부 링크를 통해 접속해주세요.
              </p>
            </>
          )}

          {status === "loading" && (
            <>
              <div className="w-8 h-8 border-2 border-[#E5E0DB] border-t-[#292524] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#6B5E57]">처리 중...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-[#1C1917] mb-2">
                수신 거부 완료
              </h1>
              <p className="text-sm text-[#6B5E57] leading-relaxed">
                <span className="font-medium text-[#1C1917]">{message}</span>
                <br />
                해당 주소로 더 이상 마케팅 이메일을 보내지 않습니다.
              </p>
              <p className="text-xs text-[#B8AFA9] mt-4">
                서비스 관련 필수 이메일(인증, 보안 알림)은 계속 발송될 수 있습니다.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-[#1C1917] mb-2">
                처리 실패
              </h1>
              <p className="text-sm text-[#6B5E57] leading-relaxed">{message}</p>
              <button
                onClick={handleUnsubscribe}
                className="mt-4 text-sm text-[#292524] underline underline-offset-2"
              >
                다시 시도
              </button>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-8 py-5 border-t border-[#E5E0DB] text-center">
          <a
            href="https://bluecollar.cv"
            className="text-xs text-[#6B5E57] hover:text-[#1C1917] transition-colors"
          >
            bluecollar.cv로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
