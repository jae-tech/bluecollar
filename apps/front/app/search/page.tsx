"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SignupModal } from "@/components/signup-modal";
import { InquiryForm } from "@/components/inquiry-form";
import { EmptyState } from "@/components/search/empty-state";
import { FilterPanel, type Filters } from "@/components/search/filter-panel";
import {
  ProjectCard,
  WorkerCard,
  SkeletonProjectCard,
  SkeletonWorkerCard,
} from "@/components/search/result-cards";
import { PROJECTS } from "@/lib/data";
import { searchWorkers, type WorkerSearchResult } from "@/lib/api";
import { FIELD_CODE_LABELS } from "@/lib/field-codes";

const DEFAULT_FILTERS: Filters = {
  specialty: "전체",
  experience: "전체",
  verification: "모든 워커",
  scale: "전체",
  sort: "인기순",
};

const SOFT_WALL_LIMIT = 12;

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<"projects" | "workers">(
    (searchParams.get("tab") as "projects" | "workers") ?? "projects",
  );
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    specialty: searchParams.get("specialty") ?? "전체",
  });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);

  // 워커 검색 결과 (API 연결)
  const [workers, setWorkers] = useState<WorkerSearchResult[]>([]);

  const applyFilters = useCallback((next: Filters) => {
    setFilters(next);
  }, []);

  const handleTabChange = (tab: "projects" | "workers") => {
    setActiveTab(tab);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // URL sync를 통해 useEffect가 자동으로 API 호출
  };

  // Sync URL query param
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    sp.set("tab", activeTab);
    if (filters.specialty !== "전체") sp.set("specialty", filters.specialty);
    router.replace(`/search?${sp.toString()}`, { scroll: false });
  }, [query, activeTab, filters.specialty, router]);

  // 워커 API 조회: 쿼리/필터 변경 시 debounce 후 호출
  useEffect(() => {
    // 전문 분야 이름 → fieldCode 역변환
    const fieldCode =
      filters.specialty !== "전체"
        ? Object.entries(FIELD_CODE_LABELS).find(
            ([, label]) => label === filters.specialty,
          )?.[0]
        : undefined;

    let minYears: number | undefined;
    let maxYears: number | undefined;
    if (filters.experience === "3년 이하") maxYears = 3;
    else if (filters.experience === "3~10년") {
      minYears = 3;
      maxYears = 10;
    } else if (filters.experience === "10년 이상") minYears = 10;

    const verifiedOnly =
      filters.verification === "Bluecollar CV 인증 완료" ? true : undefined;

    const sort: "portfolio" | "latest" | undefined =
      filters.sort === "포트폴리오 많은 순"
        ? "portfolio"
        : filters.sort === "최신순"
          ? "latest"
          : undefined;

    setLoading(true);
    const timer = setTimeout(() => {
      searchWorkers({
        q: query || undefined,
        fieldCode,
        minYears,
        maxYears,
        verifiedOnly,
        sort,
        limit: SOFT_WALL_LIMIT + 10,
      })
        .then((results) => setWorkers(results))
        .catch(() => setWorkers([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  // ── Filtered data ───────────────────────────────────────────────────────────

  const filteredProjects = PROJECTS.filter((p) => {
    if (filters.specialty !== "전체" && p.category !== filters.specialty)
      return false;
    if (filters.scale !== "전체" && p.scale !== filters.scale) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q) &&
        !p.worker.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  }).sort((a, b) => {
    if (filters.sort === "최신순") return b.id - a.id;
    return a.id - b.id;
  });

  const totalResults =
    activeTab === "projects" ? filteredProjects.length : workers.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSignupClick={() => setModalOpen(true)} />

      {/* ── Search header bar ───────────────────────────────────────────────── */}
      <div className="pt-16 border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Search input */}
          <form onSubmit={handleQuerySubmit} className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="워커의 이름, 전문 분야, 혹은 시공 키워드를 입력하세요."
              className="w-full pl-10 pr-4 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </form>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-md p-1 border border-border w-fit flex-shrink-0">
            <button
              onClick={() => handleTabChange("projects")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "projects"
                  ? "bg-card text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              프로젝트
            </button>
            <button
              onClick={() => handleTabChange("workers")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
                activeTab === "workers"
                  ? "bg-card text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              워커
            </button>
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground bg-card hover:border-primary/50 transition-colors w-fit"
          >
            <SlidersHorizontal size={15} />
            필터
            {(filters.specialty !== "전체" ||
              filters.experience !== "전체" ||
              filters.verification !== "모든 워커" ||
              filters.scale !== "전체") && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* Sidebar — desktop */}
          <div className="hidden md:block w-60 flex-shrink-0 sticky top-[145px] self-start">
            <FilterPanel filters={filters} onChange={applyFilters} />
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-semibold text-foreground">
                {totalResults}
              </span>
              개의 결과
              {query && (
                <>
                  {" "}
                  — &quot;
                  <span className="text-primary font-medium">{query}</span>
                  &quot; 검색 결과
                </>
              )}
            </p>

            {/* Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {loading ? (
                  <>
                    {Array.from({ length: 8 }).map((_, i) =>
                      activeTab === "projects" ? (
                        <SkeletonProjectCard key={i} />
                      ) : (
                        <SkeletonWorkerCard key={i} />
                      ),
                    )}
                  </>
                ) : totalResults === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <div className="w-14 h-14 rounded-md bg-secondary flex items-center justify-center">
                      <Search size={24} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        검색 결과가 없습니다
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        다른 키워드나 필터를 시도해 보세요.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setQuery("");
                        applyFilters(DEFAULT_FILTERS);
                      }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      필터 초기화
                    </button>
                  </div>
                ) : activeTab === "projects" ? (
                  filteredProjects.length > 0 ? (
                    filteredProjects
                      .slice(0, SOFT_WALL_LIMIT)
                      .map((p, i) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onClick={() => setModalOpen(true)}
                          priority={i === 0}
                        />
                      ))
                  ) : (
                    <EmptyState tab="projects" />
                  )
                ) : workers.length > 0 ? (
                  workers
                    .slice(0, SOFT_WALL_LIMIT)
                    .map((w, i) => (
                      <WorkerCard
                        key={w.id}
                        worker={w}
                        onClick={() => setModalOpen(true)}
                        priority={i === 0}
                      />
                    ))
                ) : (
                  <EmptyState tab="workers" />
                )}
              </div>

              {/* Soft wall — shown when there are more results than the limit */}
              {!loading && totalResults > SOFT_WALL_LIMIT && (
                <SoftWall
                  onSignupClick={() => setModalOpen(true)}
                  count={totalResults - SOFT_WALL_LIMIT}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[60] bg-foreground/40"
            style={{ backdropFilter: "blur(2px)" }}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-[70] w-80 max-w-[90vw] bg-card border-r border-border overflow-y-auto">
            <div className="p-4">
              <FilterPanel
                filters={filters}
                onChange={(next) => {
                  applyFilters(next);
                }}
                onClose={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </>
      )}

      <Footer onSignupClick={() => setModalOpen(true)} />
      <SignupModal open={modalOpen} onClose={() => setModalOpen(false)} />
      {inquiryFormOpen && (
        <InquiryForm onClose={() => setInquiryFormOpen(false)} />
      )}
    </div>
  );
}

function SoftWall({
  onSignupClick,
  count,
}: {
  onSignupClick: () => void;
  count: number;
}) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-64 flex flex-col items-center justify-end pb-8 gap-4"
      style={{
        background:
          "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.98) 70%, #FFFFFF 100%)",
      }}
    >
      <p className="text-sm font-semibold text-foreground text-center text-pretty max-w-sm">
        검증된 모든 워커와 상세 포트폴리오를 확인하시겠습니까?
        <span className="text-muted-foreground font-normal ml-1">
          ({count}개 더 보기)
        </span>
      </p>
      <button
        onClick={onSignupClick}
        className="bg-primary text-primary-foreground text-sm font-bold px-8 py-3.5 rounded-md hover:bg-primary/90 transition-colors"
      >
        회원가입
      </button>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
