"use client";

import { useEffect, useState } from "react";
import { getAdminDashboard, type AdminDashboardSummary } from "@/lib/api";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => setError("데이터를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        {error ?? "알 수 없는 오류"}
      </div>
    );
  }

  const statCards = [
    { label: "전체 유저", value: data.users.total },
    { label: "활성 유저", value: data.users.active },
    { label: "정지된 유저", value: data.users.suspended },
    { label: "이번 주 신규", value: data.users.newThisWeek },
    { label: "워커 프로필", value: data.workers.total },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-foreground">대시보드</h1>

      {/* 집계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg px-5 py-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 최근 가입자 */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          최근 가입자
        </h2>
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
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground text-sm"
                  >
                    가입자가 없습니다
                  </td>
                </tr>
              ) : (
                data.recentSignups.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.realName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: "bg-primary/10 text-primary",
    WORKER: "bg-blue-50 text-blue-700",
    CLIENT: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    ADMIN: "관리자",
    WORKER: "워커",
    CLIENT: "클라이언트",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[role] ?? "bg-muted text-muted-foreground"}`}
    >
      {label[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-yellow-50 text-yellow-700",
    SUSPENDED: "bg-red-50 text-red-700",
    DELETED: "bg-muted text-muted-foreground line-through",
  };
  const label: Record<string, string> = {
    ACTIVE: "활성",
    INACTIVE: "미인증",
    SUSPENDED: "정지",
    DELETED: "삭제됨",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {label[status] ?? status}
    </span>
  );
}

export { RoleBadge, StatusBadge };
