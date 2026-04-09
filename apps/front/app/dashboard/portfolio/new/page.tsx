"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMyWorkerProfile } from "@/lib/api";
import type { WorkerProfile } from "@/lib/api";
import { PortfolioForm } from "@/components/dashboard/portfolio-form";

export default function PortfolioNewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyWorkerProfile()
      .then((p) => {
        if (!p) {
          router.replace("/login");
          return;
        }
        setProfile(p);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

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
          <h1 className="text-sm font-bold text-foreground">포트폴리오 추가</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <PortfolioForm
          mode="create"
          workerProfileId={profile.id}
          onSuccess={() => router.push("/dashboard")}
          onCancel={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
}
