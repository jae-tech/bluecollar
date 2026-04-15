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
  DollarSign,
  Wrench,
  Pencil,
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
  if (!amount) return null;
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

function ImageCarousel({ images }: { images: PublicProfileMedia[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => setIdx(0), [images]);

  if (images.length === 0) return null;

  const current = images[idx];

  return (
    <div>
      {/* 메인 이미지 */}
      <div className="relative bg-secondary" style={{ aspectRatio: "16/9" }}>
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
        <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto">
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
    media,
    rooms,
    title,
    content,
    startDate,
    endDate,
    difficulty,
    estimatedCost,
    actualCost,
  } = portfolio;

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

  // 룸에 속하지 않은 사진 (비포/애프터/일반)
  const roomlessMedia = media.filter((m) => !m.roomId);
  const beforeImages = roomlessMedia.filter((m) => m.imageType === "BEFORE");
  const afterImages = roomlessMedia.filter((m) => m.imageType === "AFTER");
  const detailImages = roomlessMedia.filter(
    (m) =>
      m.imageType === "DETAIL" || m.imageType === "BLUEPRINT" || !m.imageType,
  );

  // 자재 정보: media[0].description에 "카테고리: 제품명, ..." 형태로 저장됨
  const materialsRaw = media[0]?.description;
  const materials = materialsRaw
    ? materialsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const hasRooms = roomGroups.length > 0;
  const hasBefore = beforeImages.length > 0;
  const hasAfter = afterImages.length > 0;

  // 룸도 없고 비포/애프터도 없으면 전체 미디어를 하나로
  const allImages = hasRooms || hasBefore || hasAfter ? [] : media;

  const costDisplay = (() => {
    const est = formatCost(estimatedCost);
    const act = formatCost(actualCost);
    if (est && act) return `${est} ~ ${act}`;
    if (act) return act;
    if (est) return est;
    return null;
  })();

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
        className="relative z-10 w-full md:max-w-2xl bg-card rounded-t-lg md:rounded-lg border border-border overflow-hidden max-h-[96dvh] md:max-h-[90dvh] flex flex-col"
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

        {/* 스크롤 바디 */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* 룸별 사진 섹션 */}
          {hasRooms && (
            <div>
              {roomGroups.map(({ room, images }) => (
                <div key={room.id}>
                  <div className="px-5 py-3 bg-secondary border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {roomLabel(room)}
                    </span>
                  </div>
                  <ImageCarousel images={images} />
                </div>
              ))}
            </div>
          )}

          {/* 룸에 속하지 않은 비포/애프터/일반 사진 */}
          {(hasBefore || hasAfter) && (
            <div>
              {hasBefore && (
                <div>
                  <div className="px-5 py-3 bg-secondary border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      시공 전 (Before)
                    </span>
                  </div>
                  <ImageCarousel images={beforeImages} />
                </div>
              )}
              {hasAfter && (
                <div>
                  <div className="px-5 py-3 bg-secondary border-b border-border">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      시공 후 (After)
                    </span>
                  </div>
                  <ImageCarousel images={afterImages} />
                </div>
              )}
              {detailImages.length > 0 && (
                <div>
                  <div className="px-5 py-3 bg-secondary border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      시공 과정
                    </span>
                  </div>
                  <ImageCarousel images={detailImages} />
                </div>
              )}
            </div>
          )}

          {/* 룸도 비포/애프터도 없는 경우: 전체 이미지 슬라이더 */}
          {!hasRooms && !hasBefore && !hasAfter && allImages.length > 0 && (
            <ImageCarousel images={allImages} />
          )}

          {/* 내용 */}
          <div className="p-5 flex flex-col gap-5">
            {/* 제목 */}
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {title}
            </h2>

            {/* 메타 정보 — 비용은 강조, 날짜/난이도는 보조 */}
            <div className="flex flex-wrap gap-2">
              {startDate && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                  <Calendar size={11} />
                  {startDate.slice(0, 7).replace("-", "년 ")}월
                  {endDate &&
                    endDate !== startDate &&
                    ` ~ ${endDate.slice(0, 7).replace("-", "년 ")}월`}
                </span>
              )}
              {difficultyLabel(difficulty) && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1.5 rounded-md">
                  <Wrench size={11} />
                  {difficultyLabel(difficulty)}
                </span>
              )}
              {costDisplay && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground bg-accent border border-border px-3 py-1.5 rounded-md">
                  <DollarSign size={13} />
                  {costDisplay}
                </span>
              )}
            </div>

            {/* 시공 설명 */}
            {content && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  시공 내용
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>
            )}

            {/* 사용 자재 */}
            {materials.length > 0 && (
              <div>
                <div className="h-px bg-border mb-4" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  사용 자재
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {materials.map((m, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 bg-secondary border border-border rounded-sm text-xs font-medium text-foreground"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border bg-card flex-shrink-0">
          {mode === "edit" ? (
            /* 대시보드 맥락: 편집 버튼만 표시 */
            <>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  고객에게 보이는 화면입니다
                </p>
                <p className="text-sm font-bold text-foreground">{title}</p>
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
            /* 공개 프로필 맥락: 의뢰하기/문의하기 버튼 */
            <>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  이 시공이 마음에 드세요?
                </p>
                <p className="text-sm font-bold text-foreground">
                  {workerName}
                </p>
              </div>
              {phone ? (
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
                >
                  <MessageCircle size={14} />
                  문의하기
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
