"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  type AdminUser,
  type AdminUserListResult,
} from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활성",
  INACTIVE: "미인증",
  SUSPENDED: "정지",
  DELETED: "삭제됨",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  WORKER: "워커",
  CLIENT: "클라이언트",
};

export default function AdminUsersPage() {
  const [result, setResult] = useState<AdminUserListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminUsers({
      page,
      limit: 20,
      search: search || undefined,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    })
      .then(setResult)
      .catch(() => setError("유저 목록을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: "ACTIVE" | "SUSPENDED" | "DELETED",
  ) => {
    setActionLoading(userId);
    try {
      await updateAdminUserStatus(userId, newStatus);
      load();
    } catch {
      alert("상태 변경에 실패했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "ADMIN" | "WORKER" | "CLIENT",
  ) => {
    if (!confirm(`역할을 ${ROLE_LABELS[newRole]}(으)로 변경하시겠습니까?`))
      return;
    setActionLoading(userId);
    try {
      await updateAdminUserRole(userId, newRole);
      load();
    } catch {
      alert("역할 변경에 실패했습니다");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">유저 관리</h1>

      {/* 검색/필터 */}
      <div className="flex flex-wrap gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이메일 또는 이름 검색"
            className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-60"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            검색
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">미인증</option>
          <option value="SUSPENDED">정지</option>
          <option value="DELETED">삭제됨</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none"
        >
          <option value="">전체 역할</option>
          <option value="ADMIN">관리자</option>
          <option value="WORKER">워커</option>
          <option value="CLIENT">클라이언트</option>
        </select>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                이메일
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                이름
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                역할
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                상태
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                가입일
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                작업
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
            ) : !result || result.data.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  유저가 없습니다
                </td>
              </tr>
            ) : (
              result.data.map((user: AdminUser) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {user.realName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={actionLoading === user.id}
                      onChange={(e) =>
                        handleRoleChange(
                          user.id,
                          e.target.value as AdminUser["role"],
                        )
                      }
                      className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground disabled:opacity-50"
                    >
                      <option value="ADMIN">관리자</option>
                      <option value="WORKER">워커</option>
                      <option value="CLIENT">클라이언트</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      status={user.status}
                      disabled={actionLoading === user.id}
                      onChange={(s) => handleStatusChange(user.id, s)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {actionLoading === user.id && (
                      <span className="text-xs text-muted-foreground">
                        처리 중...
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            전체 {result.total}명 중 {(page - 1) * result.limit + 1}–
            {Math.min(page * result.limit, result.total)}명
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              이전
            </button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground">
              {page} / {result.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
              disabled={page === result.totalPages}
              className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: string;
  disabled: boolean;
  onChange: (s: "ACTIVE" | "SUSPENDED" | "DELETED") => void;
}) {
  return (
    <select
      value={status}
      disabled={disabled || status === "INACTIVE" || status === "DELETED"}
      onChange={(e) =>
        onChange(e.target.value as "ACTIVE" | "SUSPENDED" | "DELETED")
      }
      className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground disabled:opacity-50"
    >
      <option value="ACTIVE">활성</option>
      <option value="INACTIVE" disabled>
        미인증
      </option>
      <option value="SUSPENDED">정지</option>
      <option value="DELETED">삭제됨</option>
    </select>
  );
}
