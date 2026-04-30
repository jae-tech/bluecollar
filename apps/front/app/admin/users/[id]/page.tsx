"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminUserDetail,
  updateAdminUserStatus,
  updateAdminUserRole,
  type AdminUserDetail,
} from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
  SUSPENDED: "정지",
  DELETED: "삭제",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border border-green-200",
  INACTIVE: "bg-gray-50 text-gray-600 border border-gray-200",
  SUSPENDED: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  DELETED: "bg-red-50 text-red-700 border border-red-200",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  WORKER: "워커",
  CLIENT: "클라이언트",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "심사 대기",
  APPROVED: "승인",
  REJECTED: "거절",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border border-green-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUserDetail(id);
      setUser(data);
    } catch {
      setError("유저 정보를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleStatusChange = async (
    newStatus: "ACTIVE" | "SUSPENDED" | "DELETED",
  ) => {
    if (actionLoading || !user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateAdminUserStatus(user.id, newStatus);
      setSuccessMsg(`상태를 ${STATUS_LABELS[newStatus]}(으)로 변경했습니다`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "상태 변경 실패");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (newRole: "ADMIN" | "WORKER" | "CLIENT") => {
    if (actionLoading || !user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateAdminUserRole(user.id, newRole);
      setSuccessMsg(`역할을 ${ROLE_LABELS[newRole]}(으)로 변경했습니다`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "역할 변경 실패");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 목록으로
        </button>
        <div className="px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error ?? "유저를 찾을 수 없습니다"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 목록으로
        </button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {user.realName ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      {/* 알림 메시지 */}
      {successMsg && (
        <div className="px-4 py-2 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
          {successMsg}
        </div>
      )}
      {actionError && (
        <div className="px-4 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {actionError}
        </div>
      )}

      {/* 유저 기본 정보 */}
      <section className="border border-border rounded-lg p-5 bg-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">상태</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[user.status] ?? ""}`}
              >
                {STATUS_LABELS[user.status] ?? user.status}
              </span>
              <select
                value={user.status}
                onChange={(e) =>
                  handleStatusChange(
                    e.target.value as "ACTIVE" | "SUSPENDED" | "DELETED",
                  )
                }
                disabled={actionLoading}
                className="text-xs border border-border rounded px-1.5 py-0.5 bg-background disabled:opacity-50"
              >
                <option value="ACTIVE">활성</option>
                <option value="SUSPENDED">정지</option>
                <option value="DELETED">삭제</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">역할</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <select
                value={user.role}
                onChange={(e) =>
                  handleRoleChange(
                    e.target.value as "ADMIN" | "WORKER" | "CLIENT",
                  )
                }
                disabled={actionLoading}
                className="text-xs border border-border rounded px-1.5 py-0.5 bg-background disabled:opacity-50"
              >
                <option value="ADMIN">관리자</option>
                <option value="WORKER">워커</option>
                <option value="CLIENT">클라이언트</option>
              </select>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">가입 방법</p>
            <p className="text-foreground">{user.provider}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">이메일 인증</p>
            <p
              className={user.emailVerified ? "text-green-600" : "text-red-600"}
            >
              {user.emailVerified ? "완료" : "미완료"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">가입일</p>
            <p className="text-foreground">
              {new Date(user.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
      </section>

      {/* 워커 프로필 */}
      {user.workerProfile ? (
        <>
          <section className="border border-border rounded-lg p-5 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                워커 프로필
              </h2>
              <div className="flex items-center gap-2">
                {user.workerProfile.businessVerified ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                    사업자 인증
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                    미인증
                  </span>
                )}
                <a
                  href={`https://bluecollar.cv/${user.workerProfile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  프로필 보기 →
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">슬러그</p>
                <p className="text-foreground font-mono">
                  @{user.workerProfile.slug}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">사업명</p>
                <p className="text-foreground">
                  {user.workerProfile.businessName}
                </p>
              </div>
              {user.workerProfile.yearsOfExperience != null && (
                <div>
                  <p className="text-muted-foreground mb-1">경력</p>
                  <p className="text-foreground">
                    {user.workerProfile.yearsOfExperience}년
                  </p>
                </div>
              )}
              {user.workerProfile.officeAddress && (
                <div>
                  <p className="text-muted-foreground mb-1">사무실 주소</p>
                  <p className="text-foreground">
                    {user.workerProfile.officeAddress}
                  </p>
                </div>
              )}
              {user.workerProfile.careerSummary && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">경력 요약</p>
                  <p className="text-foreground">
                    {user.workerProfile.careerSummary}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 사업자 서류 */}
          <section className="border border-border rounded-lg p-5 bg-card space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              사업자 서류
            </h2>
            {user.workerProfile.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                제출된 서류가 없습니다
              </p>
            ) : (
              user.workerProfile.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-b-0"
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${DOC_STATUS_COLORS[doc.status] ?? ""}`}
                  >
                    {DOC_STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                  {doc.businessNumber && (
                    <span className="text-muted-foreground font-mono text-xs">
                      {doc.businessNumber}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {new Date(doc.submittedAt).toLocaleDateString("ko-KR")}
                  </span>
                  {doc.status === "PENDING" && (
                    <Link
                      href="/admin/documents"
                      className="text-xs text-primary hover:underline ml-auto"
                    >
                      심사하기 →
                    </Link>
                  )}
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    서류 보기 ↗
                  </a>
                </div>
              ))
            )}
          </section>

          {/* 포트폴리오 목록 */}
          <section className="border border-border rounded-lg p-5 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                포트폴리오
              </h2>
              <span className="text-xs text-muted-foreground">
                {user.workerProfile.portfolios.length}개
              </span>
            </div>
            {user.workerProfile.portfolios.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                등록된 포트폴리오가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {user.workerProfile.portfolios.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-b-0"
                  >
                    <span className="text-foreground">{p.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="border border-border rounded-lg p-5 bg-card">
          <p className="text-sm text-muted-foreground">
            워커 프로필이 없습니다 (CLIENT 또는 ADMIN 계정)
          </p>
        </div>
      )}
    </div>
  );
}
