"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar,
  Wrench,
  Pencil,
  MapPin,
  Ruler,
  Tag,
  Home,
  ShieldCheck,
} from "lucide-react";
import type {
  PublicProfilePortfolio,
  PublicProfileMedia,
  PortfolioRoom,
} from "@/lib/api";

interface Props {
  portfolio: PublicProfilePortfolio | null;
  workerName: string;
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
  if (amount == null) return null;
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

// 시공 범위 표시 (snake_case → 읽기 좋게)
function constructionScopeLabel(s: string | null) {
  if (!s) return null;
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function ImageCarousel({
  images,
  compact,
}: {
  images: PublicProfileMedia[];
  compact?: boolean;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => setIdx(0), [images]);

  if (images.length === 0) return null;

  const current = images[idx];
  const ratio = compact ? "4/3" : "16/9";

  return (
    <div>
      {/* 메인 이미지 */}
      <div className="relative bg-secondary" style={{ aspectRatio: ratio }}>
        <Image
          src={current.mediaUrl}
          alt={current.description ?? `사진 ${idx + 1}`}
          fill
          className="object-cover"
          priority
        />
        {/* 타입 배지 */}
        {current.imageType && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-foreground/60 text-background text-xs font-semibold">
            {imageTypeLabel(current.imageType)}
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
              aria-label="이전 사진"
            >
              <ChevronLeft size={17} className="text-foreground" />
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(i + 1, images.length - 1))}
              disabled={idx === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
              aria-label="다음 사진"
            >
              <ChevronRight size={17} className="text-foreground" />
            </button>
            {/* 카운터 */}
            <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-foreground/60 text-background text-xs font-medium">
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
              className={`relative flex-shrink-0 w-16 h-11 rounded-md overflow-hidden border-2 transition-all ${
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
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("before")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors relative ${
              tab === "before"
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground after:-mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            시공 전
          </button>
          <button
            onClick={() => setTab("after")}
            className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors relative ${
              tab === "after"
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:-mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            시공 후
          </button>
        </div>
      )}

      {/* 이미지 */}
      {tab === "before" && beforeImages.length > 0 && (
        <ImageCarousel images={beforeImages} />
      )}
      {tab === "after" && afterImages.length > 0 && (
        <ImageCarousel images={afterImages} />
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

export function PortfolioDetailModal({
  portfolio,
  workerName,
  phone,
  onClose,
  mode = "view",
  onEdit,
}: Props) {
  useEffect(() => {
    if (portfolio) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [portfolio]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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

  // 룸별로 사진 그룹핑 (roomId 있는 미디어)
  const roomGroups: { room: PortfolioRoom; images: PublicProfileMedia[] }[] = (
    rooms ?? []
  )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((room) => ({
      room,
      images: media
        .filter((m) => m.roomId === room.id)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    }))
    .filter((g) => g.images.length > 0);

  // 룸에 속하지 않은 사진 분류
  const roomlessMedia = media.filter((m) => !m.roomId);
  const beforeImages = roomlessMedia.filter((m) => m.imageType === "BEFORE");
  const afterImages = roomlessMedia.filter((m) => m.imageType === "AFTER");
  const detailImages = roomlessMedia.filter(
    (m) =>
      m.imageType === "DETAIL" || m.imageType === "BLUEPRINT" || !m.imageType,
  );

  const hasRooms = roomGroups.length > 0;
  const hasBefore = beforeImages.length > 0;
  const hasAfter = afterImages.length > 0;
  const hasBeforeAfter = hasBefore || hasAfter;

  // 룸도 비포/애프터도 없으면 전체 미디어를 하나로
  const allImages = !hasRooms && !hasBeforeAfter ? media : [];

  const costDisplay = (() => {
    const est = formatCost(estimatedCost);
    const act = formatCost(actualCost);
    if (est && act) return `${est} ~ ${act}`;
    if (act) return act;
    if (est) return est;
    return null;
  })();

  const diffLabel = difficultyLabel(difficulty);

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

      {/* 패널 */}
      <div
        className="relative z-10 w-full md:max-w-4xl bg-card rounded-t-lg md:rounded-lg border border-border overflow-hidden max-h-[96dvh] md:max-h-[90dvh] flex flex-col"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="닫기"
        >
          <X size={15} className="text-foreground" />
        </button>

        {/* ─────────────────────────────────────────────────────────
            본문 레이아웃
            모바일: 단일 컬럼 스크롤
            데스크탑(md+): 좌(이미지) | 우(정보) 2컬럼 분할
            ───────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 md:grid md:grid-cols-[3fr_2fr] overflow-hidden">
          {/* ── 왼쪽 패널: 이미지 영역 ── */}
          <div className="overflow-y-auto md:border-r md:border-border">
            {/* 시공 전/후 (탭) */}
            {hasBeforeAfter && (
              <BeforeAfterTabs
                beforeImages={beforeImages}
                afterImages={afterImages}
              />
            )}

            {/* 공간별 사진 */}
            {hasRooms && (
              <div className={hasBeforeAfter ? "border-t border-border" : ""}>
                <RoomTabGallery groups={roomGroups} />
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

            {/* 사진 없을 때 빈 상태 (모바일 전용 — 데스크탑은 오른쪽 패널에서 처리) */}
            {media.length === 0 && (
              <div className="md:hidden px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  아직 시공 사진이 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* ── 오른쪽 패널: 시공 정보 영역 ── */}
          <div className="overflow-y-auto flex flex-col">
            {/* 제목 + 메타 배지 */}
            <div className="px-5 pt-6 pb-4 pr-14 border-b border-border">
              <h2 className="text-lg font-bold text-foreground leading-snug mb-3">
                {title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {spaceType && SPACE_TYPE_LABELS[spaceType] && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                    <Home size={11} />
                    {SPACE_TYPE_LABELS[spaceType]}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                    <MapPin size={11} />
                    {location}
                  </span>
                )}
                {startDate && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                    <Calendar size={11} />
                    {startDate.slice(0, 7).replace("-", "년 ")}월
                    {endDate &&
                      endDate !== startDate &&
                      ` ~ ${endDate.slice(0, 7).replace("-", "년 ")}월`}
                  </span>
                )}
                {diffLabel && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                    <Wrench size={11} />
                    {diffLabel}
                  </span>
                )}
                {details?.area && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                    <Ruler size={11} />
                    {details.area}
                    {details.areaUnit === "PYEONG" ? "평" : "㎡"}
                  </span>
                )}
                {costDisplay && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground bg-accent border border-border px-3 py-1.5 rounded-md">
                    <span className="text-xs">₩</span>
                    {costDisplay}
                  </span>
                )}
              </div>
              {/* 태그 */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tags.map((tag, i) => (
                    <span
                      key={`${tag.tagName}-${i}`}
                      className="flex items-center gap-1 text-xs text-accent-foreground bg-accent border border-border px-2 py-1 rounded-md"
                    >
                      <Tag size={9} />
                      {tag.tagName}
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
                          icon: <ShieldCheck size={10} />,
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
                        <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                          {item!.icon}
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
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
                  </div>
                  {phone && /^\+?[\d\s\-()+]+$/.test(phone) ? (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      <Phone size={14} />
                      의뢰하기
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary/50 text-primary-foreground text-sm font-bold flex-shrink-0 cursor-not-allowed"
                      title="전화번호 미등록"
                    >
                      <MessageCircle size={14} />
                      문의하기
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}

/** 공간별 사진 — 수평 탭 + 캐러셀 */
function RoomTabGallery({
  groups,
}: {
  groups: { room: PortfolioRoom; images: PublicProfileMedia[] }[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = groups[activeIdx];

  return (
    <div>
      {/* 섹션 라벨 */}
      <div className="px-5 pt-4 pb-0">
        <span className="text-xs font-bold text-muted-foreground uppercase">
          공간별 사진
        </span>
      </div>

      {/* 공간 탭 스크롤 */}
      <div className="flex gap-2 px-5 pt-3 pb-0 overflow-x-auto scrollbar-hide">
        {groups.map(({ room, images }, i) => (
          <button
            key={room.id}
            onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
              i === activeIdx
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
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

      {/* 선택된 공간 캐러셀 */}
      <div className="mt-3">
        {active && (
          <ImageCarousel key={active.room.id} images={active.images} />
        )}
      </div>
    </div>
  );
}
