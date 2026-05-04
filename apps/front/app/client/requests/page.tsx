"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe, getClientInquiries, cancelInquiry } from "@/lib/api";
import type { Inquiry, InquiryStatus } from "@/lib/api";
import { Logo } from "@/components/logo";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기중",
  READ: "확인됨",
  REPLIED: "답변됨",
  ACCEPTED: "수락됨",
  DECLINED: "거절됨",
  CANCELLED: "취소됨",
};

function statusClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "READ":
    case "REPLIED":
      return "bg-secondary text-muted-foreground border border-border";
    case "ACCEPTED":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "DECLINED":
    case "CANCELLED":
      return "bg-secondary text-muted-foreground border border-border opacity-60";
    default:
      return "bg-secondary text-muted-foreground border border-border";
  }
}

export default function ClientRequestsPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | "">("");

  useEffect(() => {
    // CLIENT 역할 확인
    getMe().then((user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (user.role !== "CLIENT") {
        // 워커는 대시보드로 리다이렉트
        router.replace("/dashboard");
        return;
      }
      loadInquiries();
    });
  }, [router]);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await getClientInquiries({ limit: 50 });
      setInquiries(data);
    } catch {
      // 에러는 무시
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("이 의뢰를 취소할까요?")) return;
    setCancellingId(id);
    try {
      await cancelInquiry(id);
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "CANCELLED" } : i)),
      );
    } catch {
      alert("취소 중 오류가 발생했습니다.");
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = filterStatus
    ? inquiries.filter((i) => i.status === filterStatus)
    : inquiries;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-foreground"
          >
            <Logo />
          </a>
          <button
            onClick={async () => {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/logout`,
                { method: "POST", credentials: "include" },
              ).catch(() => {});
              window.location.href = "/login";
            }}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">의뢰 내역</h1>
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            전문가 찾기 →
          </a>
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(
            [
              { value: "", label: "전체" },
              { value: "PENDING", label: "대기중" },
              { value: "ACCEPTED", label: "수락됨" },
              { value: "DECLINED", label: "거절됨" },
              { value: "CANCELLED", label: "취소됨" },
            ] as { value: InquiryStatus | ""; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`text-xs px-3 py-1.5 rounded-sm border whitespace-nowrap transition-colors ${
                filterStatus === value
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="font-semibold text-foreground">
              의뢰 내역이 없습니다
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              전문 시공인에게 의뢰를 보내보세요.
            </p>
            <a
              href="/"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              전문가 찾기 →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-card border border-border rounded-sm p-4"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {inquiry.workType}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-sm font-medium ${statusClass(inquiry.status)}`}
                      >
                        {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inquiry.location}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(inquiry.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {inquiry.budget && (
                  <p className="text-xs text-muted-foreground mb-2">
                    예산: {inquiry.budget}
                  </p>
                )}

                {inquiry.message && (
                  <p className="text-xs text-foreground bg-secondary border border-border rounded-sm px-3 py-2 line-clamp-2 mb-3">
                    {inquiry.message}
                  </p>
                )}

                {/* 취소 버튼 — PENDING/READ 상태만 */}
                {["PENDING", "READ"].includes(inquiry.status) && (
                  <button
                    disabled={cancellingId === inquiry.id}
                    onClick={() => handleCancel(inquiry.id)}
                    className="text-xs px-3 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-40"
                  >
                    {cancellingId === inquiry.id ? "취소 중..." : "의뢰 취소"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
