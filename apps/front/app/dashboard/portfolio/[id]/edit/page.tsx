"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMyWorkerProfile, getPortfolioById } from "@/lib/api";
import type { WorkerProfile, GetPortfolioByIdResponse } from "@/lib/api";
import { PortfolioForm } from "@/components/dashboard/portfolio-form";

export default function PortfolioEditPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params?.id as string | undefined;

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [initialData, setInitialData] =
    useState<GetPortfolioByIdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!portfolioId) return;

    Promise.all([getMyWorkerProfile(), getPortfolioById(portfolioId)])
      .then(([p, portfolio]) => {
        if (!p) {
          router.replace("/login");
          return;
        }
        if (!portfolio) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProfile(p);
        setInitialData(portfolio);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [portfolioId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile || !initialData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          포트폴리오를 찾을 수 없습니다.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-bold text-foreground">포트폴리오 편집</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <PortfolioForm
          mode="edit"
          portfolioId={portfolioId}
          workerProfileId={profile.id}
          initialData={initialData}
          onSuccess={() => router.push("/dashboard")}
          onCancel={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
}
