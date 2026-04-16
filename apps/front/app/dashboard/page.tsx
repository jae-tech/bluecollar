"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, User, ChevronRight, Camera } from "lucide-react";
import { getProfileUrl } from "@/lib/profile-url";
import {
  getMyWorkerProfile,
  getPublicProfile,
  deletePortfolio,
  updateWorkerProfileInfo,
  updateWorkerProfileFields,
  getCodes,
} from "@/lib/api";
import type {
  WorkerProfile,
  PublicProfilePortfolio,
  MasterCode,
} from "@/lib/api";
import { PortfolioDetailModal } from "@/components/worker/portfolio-detail-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  window.location.href = "/login";
}

// ── 업종 코드 → 한글 표시명 ────────────────────────────────────────────────────
const FIELD_LABEL: Record<string, string> = {
  FLD_TILE: "타일",
  FLD_WALLPAPER: "도배",
  FLD_PAINTING: "도장/페인팅",
  FLD_FLOORING: "장판/마루",
  FLD_PLUMBING: "설비/배관",
  FLD_ELECTRIC: "전기",
  FLD_CARPENTRY: "목공",
  FLD_WATERPROOF: "방수",
  FLD_GLAZING: "유리",
  FLD_DEMOLITION: "철거",
  FLD_WINDOW: "샷시/창호",
  FLD_FILM: "필름",
  FLD_KITCHEN: "주방/싱크대",
  FLD_ELASTIC_COAT: "탄성코트",
  FLD_BATHROOM: "욕실",
  FLD_CLEANING: "입주청소",
  FLD_WELDING: "용접",
  FLD_MACHINING: "기계가공",
};

// ── 탭 타입 ───────────────────────────────────────────────────────────────────
type Tab = "portfolio" | "profile" | "settings";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [portfolios, setPortfolios] = useState<PublicProfilePortfolio[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] =
    useState<PublicProfilePortfolio | null>(null);

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
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-foreground"
          >
            Bluecollar <span className="text-primary">CV</span>
          </a>
          <div className="flex items-center gap-4">
            <a
              href={`/worker/${profile?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              내 프로필 보기
            </a>
            <button
              onClick={logout}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* ── 프로필 요약 카드 ───────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              <User size={22} className="text-muted-foreground" />
            </div>
            {/* 이름 + URL */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground truncate leading-tight">
                {profile?.businessName ?? profile?.slug}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {profile?.slug ? getProfileUrl(profile.slug) : ""}
              </p>
            </div>
            {/* 프로필 편집 버튼 */}
            <button
              onClick={() => setActiveTab("profile")}
              className="flex-shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
            >
              편집
            </button>
          </div>

          {/* 통계 배지 */}
          {(profile?.yearsOfExperience || portfolios.length > 0) && (
            <div className="flex items-center gap-2 mt-4">
              {portfolios.length > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-md">
                  포트폴리오 {portfolios.length}개
                </span>
              )}
              {profile?.yearsOfExperience && (
                <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-md">
                  경력 {profile.yearsOfExperience}년
                </span>
              )}
              {profile?.fields && profile.fields.length > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-md">
                  {FIELD_LABEL[profile.fields[0].fieldCode] ??
                    profile.fields[0].fieldCode}
                  {profile.fields.length > 1
                    ? ` 외 ${profile.fields.length - 1}`
                    : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 탭 ───────────────────────────────────────────────────────────── */}
        <div className="flex mb-6">
          {(
            [
              { id: "portfolio", label: "포트폴리오" },
              { id: "profile", label: "프로필 편집" },
              { id: "settings", label: "설정" },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
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
            onAdd={() => router.push("/dashboard/portfolio/new")}
            onView={(p) => setSelectedPortfolio(p)}
            onEdit={(p) => router.push(`/dashboard/portfolio/${p.id}/edit`)}
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

      {/* ── 포트폴리오 상세 모달 ───────────────────────────────────────────── */}
      <PortfolioDetailModal
        portfolio={selectedPortfolio}
        workerName={profile?.businessName ?? profile?.slug ?? ""}
        mode="edit"
        onEdit={() => {
          if (selectedPortfolio)
            router.push(`/dashboard/portfolio/${selectedPortfolio.id}/edit`);
        }}
        onClose={() => setSelectedPortfolio(null)}
      />
    </div>
  );
}

// ── 포트폴리오 탭 ─────────────────────────────────────────────────────────────

function PortfolioTab({
  portfolios,
  profile,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  portfolios: PublicProfilePortfolio[];
  profile: WorkerProfile | null;
  onAdd: () => void;
  onView: (p: PublicProfilePortfolio) => void;
  onEdit: (p: PublicProfilePortfolio) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          {portfolios.length > 0
            ? `시공 사례 ${portfolios.length}개`
            : "아직 포트폴리오가 없습니다"}
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          추가
        </button>
      </div>

      {portfolios.length === 0 ? (
        <EmptyPortfolio onAdd={onAdd} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {portfolios.map((p) => (
            <PortfolioCard
              key={p.id}
              portfolio={p}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
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
  onView,
  onEdit,
  onDelete,
}: {
  portfolio: PublicProfilePortfolio;
  onView: (p: PublicProfilePortfolio) => void;
  onEdit: (p: PublicProfilePortfolio) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const thumb =
    portfolio.media?.find(
      (m: { mediaType: string; mediaUrl: string }) => m.mediaType === "IMAGE",
    )?.mediaUrl ?? null;

  return (
    <div className="group rounded-md border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      {/* 썸네일 — 클릭 시 상세 모달 오픈 */}
      <button
        onClick={() => onView(portfolio)}
        className="w-full bg-secondary relative overflow-hidden cursor-pointer block"
        style={{ aspectRatio: "4/3" }}
        aria-label={`${portfolio.title} 상세보기`}
      >
        {thumb ? (
          <Image
            src={thumb}
            alt={portfolio.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={20} className="text-muted-foreground" />
          </div>
        )}
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1 rounded-md bg-card/90 backdrop-blur-sm text-xs font-semibold text-foreground">
            미리보기
          </span>
        </div>
      </button>

      {/* 내용 + 액션 */}
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-3">
          {portfolio.title}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(portfolio)}
            className="flex-1 text-xs font-medium text-center py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            편집
          </button>
          <button
            onClick={() => onDelete(portfolio.id)}
            className="w-8 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            aria-label="삭제"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPortfolioCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="rounded-md border border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
      style={{ aspectRatio: "4/3" }}
    >
      <Plus size={20} />
      <span className="text-xs font-medium">추가</span>
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
  type EditSection = "info" | "fields" | "location" | null;
  const [editingSection, setEditingSection] = useState<EditSection>(null);

  // 저장 완료 토스트
  const [saveToast, setSaveToast] = useState(false);
  const showSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // 기본 정보 편집 폼 상태
  const [infoForm, setInfoForm] = useState({
    businessName: profile?.businessName ?? "",
    yearsOfExperience: profile?.yearsOfExperience?.toString() ?? "",
    careerSummary: profile?.careerSummary ?? "",
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // 업장 정보 편집 폼 상태
  const [locationForm, setLocationForm] = useState({
    officeCity: profile?.officeCity ?? "",
    officeDistrict: profile?.officeDistrict ?? "",
    officeAddress: profile?.officeAddress ?? "",
    operatingHours: profile?.operatingHours ?? "",
  });
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 전문 분야 편집 상태
  const [allFields, setAllFields] = useState<MasterCode[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    profile?.fields?.map((f) => f.fieldCode) ?? [],
  );
  const [fieldsSaving, setFieldsSaving] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const openInfoEdit = () => {
    setInfoForm({
      businessName: profile?.businessName ?? "",
      yearsOfExperience: profile?.yearsOfExperience?.toString() ?? "",
      careerSummary: profile?.careerSummary ?? "",
    });
    setInfoError(null);
    setEditingSection("info");
  };

  const openLocationEdit = () => {
    setLocationForm({
      officeCity: profile?.officeCity ?? "",
      officeDistrict: profile?.officeDistrict ?? "",
      officeAddress: profile?.officeAddress ?? "",
      operatingHours: profile?.operatingHours ?? "",
    });
    setLocationError(null);
    setEditingSection("location");
  };

  const saveLocation = async () => {
    if (!profile?.id) return;
    setLocationSaving(true);
    setLocationError(null);
    try {
      const updated = await updateWorkerProfileInfo(profile.id, {
        officeCity: locationForm.officeCity || undefined,
        officeDistrict: locationForm.officeDistrict || undefined,
        officeAddress: locationForm.officeAddress || undefined,
        operatingHours: locationForm.operatingHours || undefined,
      });
      setProfile({ ...profile, ...updated });
      setEditingSection(null);
      showSaveToast();
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setLocationSaving(false);
    }
  };

  const openFieldsEdit = async () => {
    setFieldsError(null);
    setSelectedFields(profile?.fields?.map((f) => f.fieldCode) ?? []);
    if (allFields.length === 0) {
      try {
        const codes = await getCodes("FIELD");
        setAllFields(codes);
      } catch {
        setFieldsError("분야 목록을 불러오지 못했습니다.");
      }
    }
    setEditingSection("fields");
  };

  const saveInfo = async () => {
    if (!profile?.id) return;
    setInfoSaving(true);
    setInfoError(null);
    try {
      const years = infoForm.yearsOfExperience
        ? parseInt(infoForm.yearsOfExperience, 10)
        : undefined;
      const updated = await updateWorkerProfileInfo(profile.id, {
        businessName: infoForm.businessName || undefined,
        yearsOfExperience: years,
        careerSummary: infoForm.careerSummary || undefined,
      });
      setProfile({ ...profile, ...updated });
      setEditingSection(null);
      showSaveToast();
    } catch (err) {
      setInfoError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setInfoSaving(false);
    }
  };

  const saveFields = async () => {
    if (!profile?.id || selectedFields.length === 0) return;
    setFieldsSaving(true);
    setFieldsError(null);
    try {
      await updateWorkerProfileFields(profile.id, selectedFields);
      setProfile({
        ...profile,
        fields: selectedFields.map((code) => ({ fieldCode: code })),
      });
      setEditingSection(null);
      showSaveToast();
    } catch (err) {
      setFieldsError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setFieldsSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-base font-bold text-foreground mb-5">프로필 편집</h2>

      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              기본 정보
            </p>
            {editingSection !== "info" && (
              <button
                onClick={openInfoEdit}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                편집
              </button>
            )}
          </div>

          {editingSection === "info" ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  상호명
                </label>
                <input
                  type="text"
                  value={infoForm.businessName}
                  onChange={(e) =>
                    setInfoForm((f) => ({ ...f, businessName: e.target.value }))
                  }
                  placeholder="예: 홍길동 타일"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  경력 (년)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={infoForm.yearsOfExperience}
                  onChange={(e) =>
                    setInfoForm((f) => ({
                      ...f,
                      yearsOfExperience: e.target.value,
                    }))
                  }
                  placeholder="예: 15"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  자기소개
                </label>
                <textarea
                  value={infoForm.careerSummary}
                  onChange={(e) =>
                    setInfoForm((f) => ({
                      ...f,
                      careerSummary: e.target.value,
                    }))
                  }
                  placeholder="예: 15년 경력 타일 전문가입니다."
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
              {infoError && (
                <p className="text-xs text-destructive">{infoError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveInfo}
                  disabled={infoSaving}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {infoSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <InfoRow
                label="상호명"
                value={profile?.businessName ?? "미설정"}
              />
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
            </>
          )}
        </div>

        {/* 업장 정보 */}
        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              업장 정보
            </p>
            {editingSection !== "location" && (
              <button
                onClick={openLocationEdit}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                편집
              </button>
            )}
          </div>

          {editingSection === "location" ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  도시
                </label>
                <input
                  type="text"
                  value={locationForm.officeCity}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      officeCity: e.target.value,
                    }))
                  }
                  placeholder="예: 서울시"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  구/동
                </label>
                <input
                  type="text"
                  value={locationForm.officeDistrict}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      officeDistrict: e.target.value,
                    }))
                  }
                  placeholder="예: 강남구"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  상세 주소
                </label>
                <input
                  type="text"
                  value={locationForm.officeAddress}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      officeAddress: e.target.value,
                    }))
                  }
                  placeholder="예: 테헤란로 123"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  운영시간
                </label>
                <input
                  type="text"
                  value={locationForm.operatingHours}
                  onChange={(e) =>
                    setLocationForm((f) => ({
                      ...f,
                      operatingHours: e.target.value,
                    }))
                  }
                  placeholder="예: 월-금 09:00-18:00"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              {locationError && (
                <p className="text-xs text-destructive">{locationError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveLocation}
                  disabled={locationSaving}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {locationSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <InfoRow
                label="지역"
                value={
                  profile?.officeCity && profile?.officeDistrict
                    ? `${profile.officeCity} ${profile.officeDistrict}`
                    : (profile?.officeCity ?? "미설정")
                }
              />
              <InfoRow
                label="운영시간"
                value={profile?.operatingHours ?? "미설정"}
              />
            </>
          )}
        </div>

        {/* 전문 분야 */}
        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              전문 분야
            </p>
            {editingSection !== "fields" && (
              <button
                onClick={openFieldsEdit}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                편집
              </button>
            )}
          </div>

          {editingSection === "fields" ? (
            <div className="flex flex-col gap-3">
              {allFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allFields.map((f) => (
                    <button
                      key={f.code}
                      onClick={() =>
                        setSelectedFields((prev) =>
                          prev.includes(f.code)
                            ? prev.filter((c) => c !== f.code)
                            : [...prev, f.code],
                        )
                      }
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        selectedFields.includes(f.code)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              {fieldsError && (
                <p className="text-xs text-destructive">{fieldsError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveFields}
                  disabled={fieldsSaving || selectedFields.length === 0}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {fieldsSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              {profile?.fields && profile.fields.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {profile.fields.map((f) => (
                    <span
                      key={f.fieldCode}
                      className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-md border border-border"
                    >
                      {FIELD_LABEL[f.fieldCode] ?? f.fieldCode}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">분야 미설정</p>
              )}
            </>
          )}
        </div>

        {/* 슬러그 / 공개 URL — 한번 정하면 변경 불가 */}
        <div className="bg-card border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              공개 주소
            </p>
            <span className="text-xs text-muted-foreground">변경 불가</span>
          </div>
          <InfoRow label="슬러그" value={`${profile?.slug}`} />
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium">
          저장되었습니다
        </div>
      )}
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
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <button
          onClick={() => alert("편집 기능은 준비 중입니다.")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
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
          className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
