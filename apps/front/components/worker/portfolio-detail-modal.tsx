"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Camera,
} from "lucide-react";
import type {
  PublicProfilePortfolio,
  PublicProfileMedia,
  PortfolioRoom,
} from "@/lib/api";

interface Props {
  portfolio: PublicProfilePortfolio | null;
  workerName: string;
  workerSlug?: string;
  phone?: string;
  onClose: () => void;
  /** "edit" 모드에서는 하단 CTA가 편집 버튼으로 교체됨 */
  mode?: "view" | "edit";
  onEdit?: () => void;
}

// 이미지 타입 표시명
function imageTypeLabel(type: string | null) {
  if (type === "BEFORE") return "시공 전";
  if (type === "AFTER") return "시공 후";
  if (type === "BLUEPRINT") return "도면";
  return "시공 중";
}

// 비용 표시 (원 단위 → 만원)
function formatCost(amount: number | null) {
  if (amount == null || amount <= 0) return null;
  const man = Math.round(amount / 10000);
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억원`;
  if (man >= 1000) return `${(man / 1000).toFixed(1)}천만원`;
  return `${man}만원`;
}

// 룸 타입 표시명
const ROOM_TYPE_LABELS: Record<string, string> = {
  LIVING: "거실",
  BATHROOM: "욕실",
  KITCHEN: "주방",
  BEDROOM: "침실",
  BALCONY: "발코니",
  ENTRANCE: "현관",
  UTILITY: "다용도실",
  STUDY: "서재",
  OTHER: "기타",
};

function roomLabel(room: PortfolioRoom): string {
  return room.roomLabel || ROOM_TYPE_LABELS[room.roomType] || room.roomType;
}

// 난이도 표시
function difficultyLabel(d: string | null) {
  if (d === "EASY") return "간단";
  if (d === "MEDIUM") return "보통";
  if (d === "HARD") return "복잡";
  return null;
}

// 공간 타입 표시
const SPACE_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "주거",
  COMMERCIAL: "상업",
  OTHER: "기타",
};

// 시공 범위 코드 → 한국어 레이블
const CONSTRUCTION_SCOPE_LABELS: Record<string, string> = {
  // 범위 유형
  FULL: "전체 리모델링",
  PARTIAL: "부분 시공",
  KITCHEN: "주방",
  BATHROOM: "욕실",
  LIVING: "거실",
  BEDROOM: "침실",
  BALCONY: "발코니",
  ENTRANCE: "현관",
  FLOOR: "바닥재",
  CEILING: "천장",
  WALL: "벽체",
  WINDOW: "창호",
  ELECTRIC: "전기",
  PLUMBING: "배관",
  TILE: "타일",
  PAINT: "도장/도배",
  DEMO: "철거",
};

function constructionScopeLabel(s: string | null) {
  if (!s) return null;
  // 코드가 매핑에 있으면 한국어로, 없으면 snake_case 분해
  if (CONSTRUCTION_SCOPE_LABELS[s]) return CONSTRUCTION_SCOPE_LABELS[s];
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function ImageCarousel({
  images,
  isPrimary = false,
}: {
  images: PublicProfileMedia[];
  isPrimary?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => setIdx(0), [images]);

  if (images.length === 0) return null;

  const current = images[idx];

  function prev() {
    setIdx((i) => Math.max(i - 1, 0));
  }
  function next() {
    setIdx((i) => Math.min(i + 1, images.length - 1));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) prev();
    touchStartX.current = null;
  }

  return (
    <div>
      {/* 메인 이미지 */}
      <div
        ref={containerRef}
        className="relative bg-secondary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        style={{ aspectRatio: "4/3" }}
        tabIndex={images.length > 1 ? 0 : -1}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role={images.length > 1 ? "group" : undefined}
        aria-label={images.length > 1 ? "이미지 갤러리" : undefined}
      >
        <Image
          src={current.mediaUrl}
          alt={current.description ?? `사진 ${idx + 1}`}
          fill
          className="object-cover"
          priority={isPrimary}
        />
        {/* 타입 배지 */}
        {current.imageType && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-sm bg-foreground/60 text-background text-xs font-semibold">
            {imageTypeLabel(current.imageType)}
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={idx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-sm bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
              aria-label="이전 사진"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>
            <button
              onClick={next}
              disabled={idx === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-sm bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
              aria-label="다음 사진"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>
            {/* 카운터 */}
            <span className="absolute bottom-3 right-3 px-2 py-1 rounded-sm bg-foreground/60 text-background text-xs font-medium">
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* 썸네일 스트립 */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative flex-shrink-0 w-16 h-11 rounded-sm overflow-hidden border-2 transition-all ${
                i === idx
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src={img.mediaUrl}
                alt={`thumb-${i}`}
                fill
                className="object-cover"
              />
              {img.imageType === "BEFORE" && (
                <span className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background text-[8px] font-bold text-center leading-4">
                  전
                </span>
              )}
              {img.imageType === "AFTER" && (
                <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[8px] font-bold text-center leading-4">
                  후
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 시공 전/후 비교 탭 컴포넌트 */
function BeforeAfterTabs({
  beforeImages,
  afterImages,
}: {
  beforeImages: PublicProfileMedia[];
  afterImages: PublicProfileMedia[];
}) {
  const [tab, setTab] = useState<"before" | "after">(
    afterImages.length > 0 ? "after" : "before",
  );

  const hasBoth = beforeImages.length > 0 && afterImages.length > 0;

  return (
    <div>
      {/* 탭 헤더 (둘 다 있을 때만) */}
      {hasBoth && (
        <div className="relative flex border-b border-border">
          <button
            onClick={() => setTab("before")}
            className={`relative flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${
              tab === "before"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            시공 전
            {tab === "before" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
          <button
            onClick={() => setTab("after")}
            className={`relative flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${
              tab === "after"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            시공 후
            {tab === "after" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      )}

      {/* 이미지 */}
      {tab === "before" && beforeImages.length > 0 && (
        <ImageCarousel
          images={beforeImages}
          isPrimary={afterImages.length === 0}
        />
      )}
      {tab === "after" && afterImages.length > 0 && (
        <ImageCarousel images={afterImages} isPrimary />
      )}

      {/* 탭이 하나뿐일 때 레이블 */}
      {!hasBoth && (
        <div className="px-5 pt-3 pb-1">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            {beforeImages.length > 0 ? "시공 전" : "시공 후"}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 공간별 사진 — sticky 탭 + 공간별 세로 스크롤
 * 탭 클릭 시 해당 공간 섹션으로 스크롤 이동
 */
function RoomScrollGallery({
  groups,
  scrollContainerRef,
}: {
  groups: { room: PortfolioRoom; images: PublicProfileMedia[] }[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabBarRef = useRef<HTMLDivElement | null>(null);

  // 탭 클릭 → 해당 섹션으로 스크롤
  function scrollToSection(idx: number) {
    const container = scrollContainerRef.current;
    const section = sectionRefs.current[idx];
    if (!container || !section) return;

    // 탭 바 높이를 동적으로 읽어 오프셋 계산
    const tabBarHeight =
      tabBarRef.current?.getBoundingClientRect().height ?? 40;
    const containerTop = container.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const offset =
      sectionTop - containerTop + container.scrollTop - tabBarHeight;

    container.scrollTo({ top: offset, behavior: "smooth" });
    setActiveIdx(idx);
  }

  // 스크롤 시 활성 탭 동기화
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function handleScroll() {
      const containerTop = container!.getBoundingClientRect().top;
      let closestIdx = 0;
      let closestDist = Infinity;

      sectionRefs.current.forEach((section, i) => {
        if (!section) return;
        const dist = Math.abs(
          section.getBoundingClientRect().top - containerTop - 56,
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });
      setActiveIdx(closestIdx);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  return (
    <div>
      {/* sticky 탭 바 */}
      <div
        ref={tabBarRef}
        className="sticky top-0 z-10 bg-card border-b border-border"
      >
        <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          {groups.map(({ room, images }, i) => (
            <button
              key={room.id}
              onClick={() => scrollToSection(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border ${
                i === activeIdx
                  ? "bg-foreground text-background border-foreground rounded-sm"
                  : "bg-card text-muted-foreground border-border rounded-sm hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {roomLabel(room)}
              {images.length > 1 && (
                <span
                  className={`text-[10px] ${
                    i === activeIdx ? "opacity-60" : "opacity-50"
                  }`}
                >
                  {images.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 공간별 이미지 세로 스크롤 */}
      {groups.map(({ room, images }, i) => (
        <div
          key={room.id}
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
          className={i > 0 ? "border-t border-border" : ""}
        >
          {/* 공간 이름 헤더 */}
          <div className="px-5 pt-4 pb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              {roomLabel(room)}
            </span>
          </div>
          <ImageCarousel key={room.id} images={images} isPrimary={i === 0} />
        </div>
      ))}
    </div>
  );
}

// overflow lock 카운터 — 복수 모달 동시 마운트 시 스크롤 잠금이 풀리는 버그 방지
// JS inline style 직접 설정 (CSS attribute selector는 Turbopack 캐시 누락 가능)
function lockBodyScroll() {
  const count = Number(document.body.dataset.overflowLock ?? 0) + 1;
  document.body.dataset.overflowLock = String(count);
  document.body.style.overflow = "hidden";
}
function unlockBodyScroll() {
  const count = Number(document.body.dataset.overflowLock ?? 0) - 1;
  if (count <= 0) {
    delete document.body.dataset.overflowLock;
    document.body.style.overflow = "";
  } else {
    document.body.dataset.overflowLock = String(count);
  }
}

export function PortfolioDetailModal({
  portfolio,
  workerName,
  workerSlug,
  phone,
  onClose,
  mode = "view",
  onEdit,
}: Props) {
  // 좌측 이미지 패널 스크롤 컨테이너 ref
  const imageScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (portfolio) {
      lockBodyScroll();
      return () => unlockBodyScroll();
    }
  }, [portfolio]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // 룸별 사진 그룹핑 — useMemo로 렌더마다 O(n×m) 재계산 방지
  // ※ Rules of Hooks: early return 이전에 선언해야 Hook 순서 불변 보장
  const {
    roomGroups,
    beforeImages,
    afterImages,
    detailImages,
    allImages,
    hasRooms,
    hasBeforeAfter,
  } = useMemo(() => {
    if (!portfolio) {
      return {
        roomGroups: [],
        beforeImages: [],
        afterImages: [],
        detailImages: [],
        allImages: [],
        hasRooms: false,
        hasBeforeAfter: false,
      };
    }

    const media = portfolio.media ?? [];
    const rooms = portfolio.rooms ?? [];

    const groups: { room: PortfolioRoom; images: PublicProfileMedia[] }[] =
      rooms
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((room) => ({
          room,
          images: media
            .filter((m) => m.roomId === room.id)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        }))
        .filter((g) => g.images.length > 0);

    const roomless = media.filter((m) => !m.roomId);
    const before = roomless.filter((m) => m.imageType === "BEFORE");
    const after = roomless.filter((m) => m.imageType === "AFTER");
    const detail = roomless.filter(
      (m) =>
        m.imageType === "DETAIL" || m.imageType === "BLUEPRINT" || !m.imageType,
    );
    const rHasRooms = groups.length > 0;
    const rHasBeforeAfter = before.length > 0 || after.length > 0;

    return {
      roomGroups: groups,
      beforeImages: before,
      afterImages: after,
      detailImages: detail,
      allImages: !rHasRooms && !rHasBeforeAfter ? media : [],
      hasRooms: rHasRooms,
      hasBeforeAfter: rHasBeforeAfter,
    };
    // portfolio.id가 같으면 media/rooms도 동일 — 동일 포트폴리오 내 re-render 최적화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio?.id]);

  if (!portfolio) return null;

  const {
    media: rawMedia,
    rooms,
    title,
    content,
    startDate,
    endDate,
    difficulty,
    estimatedCost,
    actualCost,
    location,
    spaceType,
    constructionScope,
    details,
    tags,
  } = portfolio;

  const media = rawMedia ?? [];

  // TODO-067: 예상/실제 비용 구분 표시
  const estDisplay = formatCost(estimatedCost);
  const actDisplay = formatCost(actualCost);

  const diffLabel = difficultyLabel(difficulty);

  // 태그 — API는 string[] 반환
  const allTags = tags ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 패널 — radius 최소화, 각진 느낌 */}
      <div
        className="relative z-10 w-full md:max-w-4xl bg-card rounded-t-sm md:rounded-sm border border-border overflow-hidden max-h-[96dvh] md:max-h-[90dvh] flex flex-col"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-sm bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="닫기"
        >
          <X size={14} className="text-foreground" />
        </button>

        {/* ─────────────────────────────────────────────────────────
            본문 레이아웃
            모바일: 단일 컬럼 스크롤
            데스크탑(md+): 좌(이미지 스크롤) | 우(정보) 2컬럼 분할
            ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[3fr_2fr] overflow-hidden">
          {/* ── 왼쪽 패널: 이미지 영역 (스크롤) ── */}
          <div
            ref={imageScrollRef}
            className="overflow-y-auto md:border-r md:border-border"
          >
            {/* 시공 전/후 (탭) */}
            {hasBeforeAfter && (
              <BeforeAfterTabs
                beforeImages={beforeImages}
                afterImages={afterImages}
              />
            )}

            {/* 공간별 사진 — sticky 탭 + 세로 스크롤 */}
            {hasRooms && (
              <div className={hasBeforeAfter ? "border-t border-border" : ""}>
                <RoomScrollGallery
                  key={roomGroups.map((g) => g.room.id).join("-")}
                  groups={roomGroups}
                  scrollContainerRef={imageScrollRef}
                />
              </div>
            )}

            {/* 룸도 비포/애프터도 없으면 전체 이미지 슬라이더 */}
            {allImages.length > 0 && <ImageCarousel images={allImages} />}

            {/* 도면 / 시공 과정 이미지 */}
            {detailImages.length > 0 && (
              <div className="border-t border-border">
                <div className="px-5 pt-4 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    시공 과정
                  </span>
                </div>
                <ImageCarousel images={detailImages} />
              </div>
            )}

            {/* 사진 없을 때 빈 상태 */}
            {media.length === 0 && (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <Camera size={24} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  아직 시공 사진이 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* ── 오른쪽 패널: 시공 정보 영역 ── */}
          <div className="overflow-y-auto flex flex-col border-t border-border md:border-t-0">
            {/* 제목 + 메타 배지 */}
            <div className="px-5 pt-6 pb-4 pr-14 border-b border-border">
              <h2 className="text-lg font-bold text-foreground leading-snug mb-3">
                {title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {spaceType && SPACE_TYPE_LABELS[spaceType] && (
                  <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-sm">
                    {SPACE_TYPE_LABELS[spaceType]}
                  </span>
                )}
                {location && (
                  <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-sm">
                    {location}
                  </span>
                )}
                {startDate && (
                  <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-sm">
                    {startDate.slice(0, 4)}년 {startDate.slice(5, 7)}월
                    {endDate &&
                      endDate !== startDate &&
                      ` ~ ${endDate.slice(0, 4)}년 ${endDate.slice(5, 7)}월`}
                  </span>
                )}
                {diffLabel && (
                  <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-sm">
                    {diffLabel}
                  </span>
                )}
                {details?.area && (
                  <span className="text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-sm">
                    {details.area}
                    {details.areaUnit === "PYEONG" ? "평" : "㎡"}
                  </span>
                )}
                {actDisplay && (
                  <span className="text-sm font-semibold text-foreground bg-accent border border-border px-3 py-1.5 rounded-sm">
                    ₩{actDisplay}
                  </span>
                )}
                {!actDisplay && estDisplay && (
                  <span className="text-sm font-semibold text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-sm">
                    ₩{estDisplay}
                    <span className="text-xs font-normal ml-1">예상</span>
                  </span>
                )}
              </div>
              {/* 태그 */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {allTags.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="text-xs text-accent-foreground bg-accent border border-border px-2 py-1 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 추가 상세 정보 (보증, 시공범위, 침실/욕실 수) */}
            {(details?.warrantyMonths ||
              details?.bedroomCount ||
              details?.bathroomCount ||
              constructionScope) && (
              <div className="px-5 py-5 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                  시공 정보
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    constructionScope
                      ? {
                          key: "scope",
                          label: "시공 범위",
                          value: constructionScopeLabel(constructionScope),
                          icon: null,
                        }
                      : null,
                    details?.warrantyMonths
                      ? {
                          key: "warranty",
                          label: "하자보증",
                          value: `${details.warrantyMonths}개월`,
                          icon: null,
                        }
                      : null,
                    details?.bedroomCount
                      ? {
                          key: "bedroom",
                          label: "침실 수",
                          value: `${details.bedroomCount}개`,
                          icon: null,
                        }
                      : null,
                    details?.bathroomCount
                      ? {
                          key: "bathroom",
                          label: "욕실 수",
                          value: `${details.bathroomCount}개`,
                          icon: null,
                        }
                      : null,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <div key={item!.key}>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {item!.label}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {item!.value}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 시공 내용 텍스트 */}
            {content && (
              <div className="px-5 py-5 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                  시공 내용
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>
            )}

            {/* 사진/내용 모두 없을 때 빈 상태 */}
            {media.length === 0 && !content && !hasBeforeAfter && !hasRooms && (
              <div className="px-5 py-10 text-center flex-1 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  아직 시공 사진이나 상세 내용이 없습니다.
                </p>
                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    편집하기를 눌러 사진과 내용을 추가해보세요.
                  </p>
                )}
              </div>
            )}

            {/* 하단 CTA — 오른쪽 패널 하단에 고정 */}
            <div className="mt-auto flex items-center gap-2 px-5 py-4 border-t border-border bg-card flex-shrink-0">
              {mode === "edit" ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      고객에게 보이는 화면입니다
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onEdit?.();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                  >
                    <Pencil size={14} />
                    편집하기
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      이 시공이 마음에 드세요?
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {workerName}
                    </p>
                    {workerSlug && (
                      <a
                        href={`/worker/${workerSlug}`}
                        className="text-xs text-primary hover:underline"
                        onClick={onClose}
                      >
                        프로필 전체보기 →
                      </a>
                    )}
                  </div>
                  {phone && /^\+?[\d\s\-()+]*\d[\d\s\-()+]*$/.test(phone) ? (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      <Phone size={14} />
                      의뢰하기
                    </a>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <button
                        disabled
                        className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-secondary text-muted-foreground border border-border text-sm font-bold cursor-not-allowed"
                      >
                        <MessageCircle size={14} />
                        문의하기
                      </button>
                      <p className="text-[10px] text-muted-foreground">
                        전화번호 미등록
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
