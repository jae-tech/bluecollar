"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminAuditLogs,
  type AdminAuditLog,
  type AuditAction,
} from "@/lib/api";

const ACTION_LABELS: Record<string, string> = {
  CODE_CREATE: "코드 생성",
  CODE_UPDATE: "코드 수정",
  CODE_DELETE: "코드 삭제",
  USER_STATUS_CHANGE: "유저 상태 변경",
  USER_ROLE_CHANGE: "유저 역할 변경",
  DOCUMENT_APPROVE: "서류 승인",
  DOCUMENT_REJECT: "서류 거절",
};

const ACTION_COLORS: Record<string, string> = {
  CODE_CREATE: "bg-blue-50 text-blue-700 border border-blue-200",
  CODE_UPDATE: "bg-blue-50 text-blue-700 border border-blue-200",
  CODE_DELETE: "bg-red-50 text-red-700 border border-red-200",
  USER_STATUS_CHANGE: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  USER_ROLE_CHANGE: "bg-purple-50 text-purple-700 border border-purple-200",
  DOCUMENT_APPROVE: "bg-green-50 text-green-700 border border-green-200",
  DOCUMENT_REJECT: "bg-red-50 text-red-700 border border-red-200",
};

const ALL_ACTIONS: AuditAction[] = [
  "CODE_CREATE",
  "CODE_UPDATE",
  "CODE_DELETE",
  "USER_STATUS_CHANGE",
  "USER_ROLE_CHANGE",
  "DOCUMENT_APPROVE",
  "DOCUMENT_REJECT",
];

/** JSON 문자열을 파싱해 줄별로 표시합니다 */
function JsonToggle({ value, label }: { value: string | null; label: string }) {
  const [open, setOpen] = useState(false);

  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return <span className="text-xs text-muted-foreground">{value}</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-primary hover:underline"
      >
        {label} {open ? "▲" : "▼"}
      </button>
      {open && (
        <pre className="mt-1 text-xs bg-muted/40 rounded p-2 overflow-auto max-w-xs whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAuditLogs({
        page,
        action: actionFilter || undefined,
      });
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setError("감사 로그를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">감사 로그</h1>
        <p className="text-sm text-muted-foreground mt-1">
          관리자 액션(유저 변경, 코드 변경, 서류 심사) 이력을 확인합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value as AuditAction | "");
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none"
        >
          <option value="">전체 액션</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{total}</span>건
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* 로그 테이블 */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                시각
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                관리자
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                액션
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                대상
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                변경 전
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                변경 후
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  불러오는 중...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  로그가 없습니다
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">
                    {log.adminEmail ?? (
                      <span className="text-muted-foreground">
                        [삭제된 관리자]
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border border-gray-200"}`}
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="font-mono text-xs">{log.targetType}</div>
                    <div
                      className="font-mono text-xs truncate max-w-[120px]"
                      title={log.targetId}
                    >
                      {log.targetId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <JsonToggle value={log.before} label="이전" />
                  </td>
                  <td className="px-4 py-3">
                    <JsonToggle value={log.after} label="이후" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
