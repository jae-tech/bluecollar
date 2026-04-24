"use client";

import { useEffect, useState } from "react";
import {
  getAdminInbox,
  getAdminInboxMessage,
  type AdminInboxMessage,
  type AdminInboxMessageDetail,
} from "@/lib/api";

export default function AdminInboxPage() {
  const [messages, setMessages] = useState<AdminInboxMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminInboxMessageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadList = (p = page) => {
    setLoading(true);
    setError(null);
    getAdminInbox(p, limit)
      .then(({ data, total: t }) => {
        setMessages(data);
        setTotal(t);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "수신함을 불러오지 못했습니다";
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSelect = async (uid: number) => {
    setSelectedUid(uid);
    setDetailLoading(true);
    setDetail(null);
    try {
      const msg = await getAdminInboxMessage(uid);
      setDetail(msg);
      // 목록에서 읽음 상태 업데이트
      setMessages((prev) =>
        prev.map((m) => (m.uid === uid ? { ...m, seen: true } : m)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "메시지 조회 실패";
      setError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedUid(null);
    setDetail(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">수신함</h1>
        <span className="text-xs text-muted-foreground">
          support@bluecollar.cv
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {selectedUid !== null ? (
        /* ── 메시지 상세 보기 ── */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 목록으로
            </button>
          </div>

          {detailLoading ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          ) : detail ? (
            <div className="divide-y divide-border">
              {/* 헤더 */}
              <div className="px-4 py-4 space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  {detail.subject}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium">보낸 사람:</span>{" "}
                    {detail.from}
                  </span>
                  <span>
                    <span className="font-medium">받는 사람:</span> {detail.to}
                  </span>
                  <span>
                    {new Date(detail.date).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* 본문 */}
              <div className="px-4 py-4">
                {detail.html ? (
                  <iframe
                    srcDoc={detail.html}
                    className="w-full min-h-[400px] border-0 rounded"
                    sandbox="allow-same-origin"
                    title="메일 본문"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                    {detail.text ?? "(본문 없음)"}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* ── 목록 보기 ── */
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {total}개 메시지
            </p>
            <button
              onClick={() => loadList(page)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          ) : messages.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              메시지가 없습니다
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {messages.map((msg) => (
                <li key={msg.uid}>
                  <button
                    onClick={() => handleSelect(msg.uid)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* 읽음 여부 표시 */}
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          msg.seen ? "bg-transparent" : "bg-primary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm truncate ${
                              msg.seen
                                ? "text-muted-foreground"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {msg.subject}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(msg.date).toLocaleDateString("ko-KR", {
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <span className="font-medium">{msg.from}</span>
                          {msg.snippet && (
                            <span className="ml-2">{msg.snippet}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
