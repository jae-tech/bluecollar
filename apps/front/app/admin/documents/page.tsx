"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAdminDocuments,
  approveAdminDocument,
  rejectAdminDocument,
  type AdminDocument,
  type DocumentStatus,
} from "@/lib/api";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border border-green-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
};

type FilterTab = "ALL" | DocumentStatus;

export default function AdminDocumentsPage() {
  const [tab, setTab] = useState<FilterTab>("PENDING");
  const [docs, setDocs] = useState<AdminDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDocuments({
        page,
        status: tab === "ALL" ? undefined : tab,
      });
      setDocs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setError("서류 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);
    try {
      await approveAdminDocument(id);
      setSuccessMsg("서류를 승인했습니다");
      setTimeout(() => setSuccessMsg(null), 3000);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "승인 처리 실패");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim() || actionLoading) return;
    setActionLoading(rejectTarget);
    setError(null);
    try {
      await rejectAdminDocument(rejectTarget, rejectReason.trim());
      setSuccessMsg("서류를 거절했습니다");
      setTimeout(() => setSuccessMsg(null), 3000);
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "거절 처리 실패");
    } finally {
      setActionLoading(null);
    }
  };

  const TABS: { value: FilterTab; label: string }[] = [
    { value: "PENDING", label: "대기" },
    { value: "ALL", label: "전체" },
    { value: "APPROVED", label: "승인" },
    { value: "REJECTED", label: "거절" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">사업자 서류 심사</h1>
        <p className="text-sm text-muted-foreground mt-1">
          워커가 제출한 사업자등록증을 검토하고 승인 또는 거절합니다.
        </p>
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 알림 메시지 */}
      {successMsg && (
        <div className="mb-4 px-4 py-2 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* 결과 건수 */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          총 <span className="font-medium text-foreground">{total}</span>건
        </p>
      )}

      {/* 서류 목록 */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          불러오는 중...
        </div>
      ) : docs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          해당 서류가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="border border-border rounded-lg p-5 bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                {/* 서류 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}
                    >
                      {STATUS_LABELS[doc.status]}
                    </span>
                    {doc.businessNumber && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {doc.businessNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {doc.workerSlug ? (
                      <Link
                        href={`/admin/users/${doc.workerUserId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {doc.workerUserRealName ||
                          doc.workerBusinessName ||
                          doc.workerSlug}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        알 수 없는 워커
                      </span>
                    )}
                    {doc.workerSlug && (
                      <span className="text-xs text-muted-foreground">
                        @{doc.workerSlug}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    제출일:{" "}
                    {new Date(doc.submittedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {doc.validationMessage && (
                    <p className="text-xs text-muted-foreground mt-1">
                      거절 사유: {doc.validationMessage}
                    </p>
                  )}
                </div>

                {/* 서류 이미지 미리보기 */}
                <div className="flex-shrink-0">
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-24 h-24 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    title="새 탭에서 원본 보기"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={doc.documentUrl}
                      alt="사업자등록증"
                      className="w-full h-full object-cover"
                    />
                  </a>
                </div>
              </div>

              {/* 승인/거절 버튼 (PENDING 상태만) */}
              {doc.status === "PENDING" && (
                <div className="mt-4 pt-4 border-t border-border">
                  {rejectTarget === doc.id ? (
                    /* 거절 사유 입력 폼 */
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">
                        거절 사유
                      </label>
                      <textarea
                        className="w-full border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                        placeholder="거절 사유를 입력해주세요"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={
                            !rejectReason.trim() || actionLoading === doc.id
                          }
                          className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
                        >
                          거절 확정
                        </button>
                        <button
                          onClick={() => {
                            setRejectTarget(null);
                            setRejectReason("");
                          }}
                          className="px-3 py-1.5 rounded-md text-sm border border-border text-foreground hover:bg-muted transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(doc.id)}
                        disabled={!!actionLoading}
                        className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {actionLoading === doc.id ? "처리 중..." : "승인"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectTarget(doc.id);
                          setRejectReason("");
                        }}
                        disabled={!!actionLoading}
                        className="px-3 py-1.5 rounded-md text-sm border border-border text-foreground font-medium disabled:opacity-50 hover:bg-muted transition-colors"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
