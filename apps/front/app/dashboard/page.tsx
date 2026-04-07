"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  User,
  Briefcase,
  Settings,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Camera,
  Search,
} from "lucide-react";
import {
  getMyWorkerProfile,
  getPublicProfile,
  deletePortfolio,
} from "@/lib/api";
import type { WorkerProfile, PublicProfilePortfolio } from "@/lib/api";
import { PortfolioAddModal } from "@/components/dashboard/portfolio-add-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "bluecollar.cv";

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  window.location.href = "/login";
}

// ── 탭 타입 ───────────────────────────────────────────────────────────────────
type Tab = "portfolio" | "profile" | "settings";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [portfolios, setPortfolios] = useState<PublicProfilePortfolio[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 포트폴리오 목록 새로고침
  const refreshPortfolios = async (slug: string) => {
    const pub = await getPublicProfile(slug).catch(() => null);
    if (pub) setPortfolios(pub.portfolios ?? []);
  };

  useEffect(() => {
    getMyWorkerProfile()
      .then(async (p) => {
        if (!p?.slug) {
          router.replace("/onboarding/slug");
          return;
        }
        setProfile(p);
        await refreshPortfolios(p.slug);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── 상단 헤더 ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-foreground"
          >
            Bluecollar <span className="text-primary">CV</span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/search"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search size={13} />
              워커 검색
            </a>
            <a
              href={`/worker/${profile?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={13} />내 프로필 보기
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* ── 프로필 요약 카드 ───────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-md p-5 mb-6 flex items-center gap-4">
          {/* 아바타 */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
              <User size={24} className="text-muted-foreground" />
            </div>
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground truncate">
                {profile?.businessName ?? profile?.slug}
              </p>
              {profile?.slug && (
                <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                  <CheckCircle2 size={11} />
                  인증됨
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile?.slug}.{BASE_URL}
            </p>
          </div>

          {/* 프로필 보기 링크 (모바일) */}
          <a
            href={`/worker/${profile?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden flex-shrink-0 p-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        {/* ── 탭 ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-secondary rounded-md p-1 border border-border mb-6 w-fit">
          {(
            [
              { id: "portfolio", label: "포트폴리오", icon: Briefcase },
              { id: "profile", label: "프로필 편집", icon: User },
              { id: "settings", label: "설정", icon: Settings },
            ] as { id: Tab; label: string; icon: React.ElementType }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-card text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ─────────────────────────────────────────────────── */}
        {deleteError && (
          <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {deleteError}
          </div>
        )}
        {activeTab === "portfolio" && (
          <PortfolioTab
            portfolios={portfolios}
            profile={profile}
            onAdd={() => setAddModalOpen(true)}
            onDelete={async (id) => {
              if (
                !confirm(
                  "포트폴리오를 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
                )
              )
                return;
              try {
                setDeleteError(null);
                await deletePortfolio(id);
                if (profile?.slug) await refreshPortfolios(profile.slug);
              } catch {
                setDeleteError(
                  "삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
                );
              }
            }}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab profile={profile} setProfile={setProfile} />
        )}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {/* ── 포트폴리오 추가 모달 ───────────────────────────────────────────── */}
      {addModalOpen && profile?.id && (
        <PortfolioAddModal
          workerProfileId={profile.id}
          onClose={() => setAddModalOpen(false)}
          onSuccess={async () => {
            setAddModalOpen(false);
            if (profile?.slug) await refreshPortfolios(profile.slug);
          }}
        />
      )}
    </div>
  );
}

// ── 포트폴리오 탭 ─────────────────────────────────────────────────────────────

function PortfolioTab({
  portfolios,
  profile,
  onAdd,
  onDelete,
}: {
  portfolios: PublicProfilePortfolio[];
  profile: WorkerProfile | null;
  onAdd: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-foreground">포트폴리오</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {portfolios.length}개의 시공 사례
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      {portfolios.length === 0 ? (
        <EmptyPortfolio onAdd={onAdd} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} onDelete={onDelete} />
          ))}
          <AddPortfolioCard onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}

function EmptyPortfolio({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-md bg-secondary border border-border flex items-center justify-center">
        <Camera size={22} className="text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">포트폴리오가 없습니다</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          시공 사진과 설명을 추가해서 고객들에게 나의 기술력을 보여주세요.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus size={15} />첫 포트폴리오 추가
      </button>
    </div>
  );
}

function PortfolioCard({
  portfolio,
  onDelete,
}: {
  portfolio: PublicProfilePortfolio;
  onDelete: (id: string) => Promise<void>;
}) {
  const thumb =
    portfolio.media?.find(
      (m: { mediaType: string; mediaUrl: string }) => m.mediaType === "IMAGE",
    )?.mediaUrl ?? null;

  return (
    <div className="group rounded-md border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
      {/* 썸네일 */}
      <div className="aspect-video bg-secondary relative overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={portfolio.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={24} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">
          {portfolio.title}
        </p>
        {portfolio.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {portfolio.content}
          </p>
        )}
      </div>

      {/* 액션 */}
      <div className="px-3.5 pb-3.5 flex items-center gap-2">
        <button
          onClick={() => onDelete(portfolio.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
        >
          <Trash2 size={12} />
          삭제
        </button>
      </div>
    </div>
  );
}

function AddPortfolioCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="rounded-md border border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors aspect-square flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary min-h-[160px]"
    >
      <Plus size={24} />
      <span className="text-sm font-medium">포트폴리오 추가</span>
    </button>
  );
}

// ── 프로필 편집 탭 ────────────────────────────────────────────────────────────

function ProfileTab({
  profile,
  setProfile,
}: {
  profile: WorkerProfile | null;
  setProfile: (p: WorkerProfile) => void;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="text-base font-bold text-foreground mb-5">프로필 편집</h2>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <SectionCard title="기본 정보" href="#">
          <InfoRow label="상호명" value={profile?.businessName ?? "미설정"} />
          <InfoRow
            label="경력"
            value={
              profile?.yearsOfExperience
                ? `${profile.yearsOfExperience}년차`
                : "미설정"
            }
          />
          <InfoRow
            label="자기소개"
            value={profile?.careerSummary ?? "미설정"}
            truncate
          />
        </SectionCard>

        {/* 전문 분야 */}
        <SectionCard title="전문 분야" href="#">
          {profile?.fields && profile.fields.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {profile.fields.map((f) => (
                <span
                  key={f.fieldCode}
                  className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-md border border-border"
                >
                  {f.fieldCode}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">분야 미설정</p>
          )}
        </SectionCard>

        {/* 슬러그 / 공개 URL */}
        <SectionCard title="공개 주소" href="#">
          <InfoRow label="슬러그" value={`${profile?.slug}`} />
        </SectionCard>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        프로필 편집 기능은 순차적으로 오픈됩니다.
      </p>
    </div>
  );
}

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <button
          onClick={() => alert("편집 기능은 준비 중입니다.")}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil size={11} />
          편집
        </button>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-sm text-foreground ${truncate ? "line-clamp-2" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── 설정 탭 ───────────────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <div className="max-w-xl">
      <h2 className="text-base font-bold text-foreground mb-5">설정</h2>

      <div className="flex flex-col gap-3">
        {[
          { label: "알림 설정", desc: "문의 알림, 이메일 수신 설정" },
          { label: "계정 보안", desc: "비밀번호 변경, 2단계 인증" },
          {
            label: "계정 삭제",
            desc: "계정 및 데이터 영구 삭제",
            danger: true,
          },
        ].map(({ label, desc, danger }) => (
          <button
            key={label}
            onClick={() => alert("해당 기능은 준비 중입니다.")}
            className="flex items-center justify-between w-full bg-card border border-border rounded-md px-4 py-3.5 text-left hover:border-primary/40 transition-colors group"
          >
            <div>
              <p
                className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}
              >
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
            />
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
