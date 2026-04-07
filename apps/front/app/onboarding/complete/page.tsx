"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Check, ArrowRight } from "lucide-react";
import { getMyWorkerProfile } from "@/lib/api";
import type { WorkerProfile } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "bluecollar.cv";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyWorkerProfile()
      .then((p) => {
        if (!p?.slug) {
          // 프로필 없거나 slug 미설정 → slug 설정 단계로
          router.replace("/onboarding/slug");
          return;
        }
        setProfile(p);
        setLoading(false);
      })
      .catch(() => {
        // API 오류 시 slug 설정 단계로 이동
        router.replace("/onboarding/slug");
      });
  }, [router]);

  const profileUrl = profile ? `${profile.slug}.${BASE_URL}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 환경 무시
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        {/* 축하 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
        </div>

        {/* 제목 */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          {profile?.businessName ?? profile?.slug}님의
          <br />
          프로필이 완성됐어요!
        </h1>
        <p className="text-base text-muted-foreground mb-8">
          이제 고객들이 내 프로필을 찾을 수 있습니다.
          <br />
          링크를 복사해서 지금 바로 공유해보세요.
        </p>

        {/* 프로필 URL 박스 */}
        <div className="bg-secondary rounded-xl border border-border p-4 mb-4 flex items-center gap-3">
          <p className="flex-1 text-sm font-medium text-foreground break-all text-left">
            {profileUrl}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} />
                복사됨
              </>
            ) : (
              <>
                <Copy size={13} />
                복사
              </>
            )}
          </button>
        </div>

        {/* 내 프로필 보기 CTA */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full py-3.5 rounded-md bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 active:scale-95 transition-colors flex items-center justify-center gap-2"
        >
          대시보드로 이동
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
