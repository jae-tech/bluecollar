"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  uploadFile,
  createPortfolio,
  updatePortfolio,
  type CreatePortfolioMediaPayload,
  type GetPortfolioByIdResponse,
} from "@/lib/api";
import {
  SPACE_TYPE_LABEL,
  COST_OPTIONS,
  MATERIAL_CATEGORIES,
  DIFFICULTY_OPTIONS,
} from "@/lib/constants";

// ── 타입 ───────────────────────────────────────────────────────────────────────
interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
  imageType: "BEFORE" | "AFTER" | "DETAIL" | null;
}

interface Props {
  mode: "create" | "edit";
  workerProfileId: string;
  portfolioId?: string;
  initialData?: GetPortfolioByIdResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PortfolioForm({
  mode,
  workerProfileId,
  portfolioId,
  initialData,
  onSuccess,
  onCancel,
}: Props) {
  const isEditMode = mode === "edit";

  // 편집 모드 초기 이미지 변환
  const buildInitialImages = (): UploadedImage[] => {
    if (!initialData) return [];
    return initialData.media
      .filter((m) => m.mediaType === "IMAGE")
      .map((m) => ({
        file: new File([], m.mediaUrl.split("/").pop() ?? "image"),
        previewUrl: m.mediaUrl,
        uploadedUrl: m.mediaUrl,
        uploading: false,
        error: null,
        imageType:
          (m.imageType as "BEFORE" | "AFTER" | "DETAIL" | null) ?? null,
      }));
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [images, setImages] = useState<UploadedImage[]>(buildInitialImages);

  // Step 2: 기본 정보
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "">(
    (initialData?.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined) ?? "",
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0]
      : "",
  );
  const [costRangeIdx, setCostRangeIdx] = useState<number>(() => {
    if (!initialData?.estimatedCost) return -1;
    const v = Number(initialData.estimatedCost);
    return COST_OPTIONS.findIndex(
      (o) => Math.abs(o.estimatedValue - v) < v * 0.3,
    );
  });

  // Step 3: 현장 정보
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [area, setArea] = useState(
    initialData?.details?.area
      ? parseFloat(initialData.details.area).toString()
      : "",
  );
  const [areaUnit, setAreaUnit] = useState<"PYEONG" | "SQMETER">(
    (initialData?.details?.areaUnit as
      | "PYEONG"
      | "SQMETER"
      | null
      | undefined) ?? "PYEONG",
  );
  const [spaceType, setSpaceType] = useState<
    "RESIDENTIAL" | "COMMERCIAL" | "OTHER" | ""
  >(
    (initialData?.spaceType as
      | "RESIDENTIAL"
      | "COMMERCIAL"
      | "OTHER"
      | null
      | undefined) ?? "",
  );
  const [constructionScope, setConstructionScope] = useState(
    initialData?.constructionScope ?? "",
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [warrantyMonths, setWarrantyMonths] = useState(
    initialData?.details?.warrantyMonths?.toString() ?? "",
  );

  // 비포/애프터 지정 (Step 2에서 진행)
  const setImageType = (
    idx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, imageType: type } : img)),
    );
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 이미지 업로드 ────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const newImages: UploadedImage[] = Array.from(files)
        .slice(0, 10 - images.length)
        .map((f) => ({
          file: f,
          previewUrl: URL.createObjectURL(f),
          uploadedUrl: null,
          uploading: true,
          error: null,
          imageType: null,
        }));

      setImages((prev) => [...prev, ...newImages]);

      const uploaded = await Promise.all(
        newImages.map(async (img) => {
          try {
            const result = await uploadFile(img.file);
            return { ...img, uploadedUrl: result.url, uploading: false };
          } catch {
            return { ...img, uploading: false, error: "업로드 실패" };
          }
        }),
      );

      setImages((prev) => {
        const existing = prev.filter(
          (p) => !newImages.some((n) => n.previewUrl === p.previewUrl),
        );
        return [...existing, ...uploaded];
      });
    },
    [images.length],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].previewUrl);
      next.splice(idx, 1);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // ── 완성도 ─────────────────────────────────────────────────────────────────
  const score = (() => {
    let s = 2;
    if (tags.length > 0) s++;
    if (
      images.some((i) => i.imageType === "BEFORE") &&
      images.some((i) => i.imageType === "AFTER")
    )
      s++;
    if (constructionScope.trim()) s++;
    return Math.min(s, 5);
  })();

  // ── 제출 ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || images.length === 0) return;
    const uploadedImages = images.filter((i) => i.uploadedUrl);
    if (uploadedImages.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const media: CreatePortfolioMediaPayload[] = uploadedImages.map(
        (img) => ({
          mediaUrl: img.uploadedUrl!,
          mediaType: "IMAGE",
          imageType: img.imageType ?? undefined,
        }),
      );

      const selectedCost =
        costRangeIdx >= 0 ? COST_OPTIONS[costRangeIdx] : null;
      const areaNum = area ? parseFloat(area) : undefined;
      const warrantyNum = warrantyMonths
        ? parseInt(warrantyMonths, 10)
        : undefined;

      const payload = {
        title: title.trim(),
        location: location.trim() || undefined,
        spaceType: (spaceType || undefined) as
          | "RESIDENTIAL"
          | "COMMERCIAL"
          | "OTHER"
          | undefined,
        constructionScope: constructionScope.trim() || undefined,
        details:
          areaNum || warrantyNum
            ? { area: areaNum, areaUnit, warrantyMonths: warrantyNum }
            : undefined,
        tags: tags.length > 0 ? tags : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        difficulty: (difficulty || undefined) as
          | "EASY"
          | "MEDIUM"
          | "HARD"
          | undefined,
        estimatedCost: selectedCost?.estimatedValue,
        costVisibility: (selectedCost ? "PUBLIC" : "PRIVATE") as
          | "PUBLIC"
          | "PRIVATE",
        media,
      };

      if (isEditMode && portfolioId) {
        await updatePortfolio(portfolioId, payload);
      } else {
        await createPortfolio({ ...payload, workerProfileId });
      }

      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "포트폴리오 저장 중 오류가 발생했습니다",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceedStep1 =
    images.length > 0 && images.every((i) => !i.uploading);
  const canProceedStep2 = title.trim().length >= 5;

  const stepLabels = ["사진 선택", "기본 정보", "현장 정보", "확인 및 저장"];

  return (
    <div className="flex flex-col gap-6">
      {/* 진행 단계 표시 */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle2 size={12} /> : s}
            </div>
            {s < 4 && (
              <div
                className={`h-0.5 flex-1 rounded transition-colors ${step > s ? "bg-primary/30" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Step {step}: {stepLabels[step - 1]}
      </p>

      {/* ── Step 1: 사진 ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              시공 사진을 업로드해주세요
            </p>
            <p className="text-xs text-muted-foreground">
              최대 10장. JPEG, PNG, WebP 지원.
            </p>
          </div>

          {images.length < 10 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">
                사진을 드래그하거나 클릭해서 선택
              </span>
              <span className="text-xs">({images.length}/10)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.previewUrl}
                  className="relative aspect-square rounded-md overflow-hidden border border-border bg-secondary"
                >
                  <Image
                    src={img.previewUrl}
                    alt={`사진 ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                      <Loader2
                        size={20}
                        className="text-primary-foreground animate-spin"
                      />
                    </div>
                  )}
                  {!img.uploading && !img.error && (
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-foreground/70 rounded-full flex items-center justify-center text-primary-foreground hover:bg-destructive transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: 기본 정보 ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              제목 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 마포구 아파트 타일 시공"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {title.length}/100
            </p>
          </div>

          {/* 시공 기간 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              시공 기간 (선택)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <span className="text-muted-foreground text-sm">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              공사 규모 (선택)
            </p>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() =>
                    setDifficulty((v) => (v === value ? "" : value))
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    difficulty === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 비용 범위 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              비용 범위 (선택, 공개)
            </p>
            <div className="flex flex-wrap gap-2">
              {COST_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setCostRangeIdx((v) => (v === idx ? -1 : idx))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    costRangeIdx === idx
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 비포/애프터 지정 */}
          {images.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                비포/애프터 지정 (선택)
              </p>
              <div className="flex flex-col gap-2">
                {images.slice(0, 6).map((img, idx) => (
                  <div key={img.previewUrl} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden border border-border flex-shrink-0">
                      <Image
                        src={img.previewUrl}
                        alt={`사진 ${idx + 1}`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      {(
                        [
                          { label: "비포", value: "BEFORE" as const },
                          { label: "애프터", value: "AFTER" as const },
                          { label: "일반", value: "DETAIL" as const },
                        ] as const
                      ).map(({ label, value }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setImageType(
                              idx,
                              img.imageType === value ? null : value,
                            )
                          }
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            img.imageType === value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {images.length > 6 && (
                  <p className="text-xs text-muted-foreground">
                    +{images.length - 6}장은 상세 사진으로 자동 처리됩니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: 현장 정보 ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-muted-foreground">
            모두 선택사항입니다. 입력할수록 고객이 더 잘 찾을 수 있어요.
          </p>

          {/* 현장명/위치 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              시공 위치
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 마포구, 강남 아파트 등"
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* 평형대 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              평형대
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="예: 32"
                min={0}
                max={9999}
                step={0.5}
                className="flex-1 px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <div className="flex gap-1">
                {(["PYEONG", "SQMETER"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setAreaUnit(unit)}
                    className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      areaUnit === unit
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {unit === "PYEONG" ? "평" : "m²"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 공간 유형 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              공간 유형
            </p>
            <div className="flex gap-2">
              {(["RESIDENTIAL", "COMMERCIAL", "OTHER"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSpaceType((v) => (v === type ? "" : type))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    spaceType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {SPACE_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 시공 범위 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              시공 범위
            </label>
            <textarea
              value={constructionScope}
              onChange={(e) => setConstructionScope(e.target.value)}
              placeholder="어떤 공사를 했는지 간단히 적어주세요. 예: 욕실 타일 전체 교체, 바닥+벽 포함"
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* 자재 태그 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              사용 자재 태그
            </p>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleTag(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    tags.includes(cat)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* A/S 보증기간 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              A/S 보증기간 (개월)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                placeholder="예: 12"
                min={0}
                max={120}
                step={1}
                className="w-32 px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <span className="text-xs text-muted-foreground">
                개월 (최대 120개월 = 10년)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: 확인 ── */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          {/* 완성도 */}
          <div className="bg-secondary rounded-md p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                포트폴리오 완성도
              </span>
              <span className="text-xs font-bold text-foreground">
                {score}/5
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${i < score ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {score < 3 &&
                "자재 태그나 시공 범위를 추가하면 신뢰도가 높아져요."}
              {score === 3 && "좋아요! 비포/애프터를 추가하면 더 좋아요."}
              {score === 4 && "훌륭해요! 조금만 더 채우면 최고 등급이에요."}
              {score === 5 && "완벽한 포트폴리오입니다!"}
            </p>
          </div>

          {/* 요약 */}
          <div className="flex flex-col gap-0">
            <SummaryRow label="제목" value={title} />
            <SummaryRow
              label="사진"
              value={`${images.filter((i) => i.uploadedUrl).length}장`}
            />
            {location && <SummaryRow label="위치" value={location} />}
            {area && (
              <SummaryRow
                label="평형"
                value={`${area}${areaUnit === "SQMETER" ? "m²" : "평"}`}
              />
            )}
            {spaceType && (
              <SummaryRow
                label="공간 유형"
                value={SPACE_TYPE_LABEL[spaceType]}
              />
            )}
            {tags.length > 0 && (
              <SummaryRow label="자재 태그" value={tags.join(", ")} />
            )}
            {warrantyMonths && (
              <SummaryRow label="A/S 보증" value={`${warrantyMonths}개월`} />
            )}
            {(startDate || endDate) && (
              <SummaryRow
                label="시공 기간"
                value={`${startDate || "?"} ~ ${endDate || "?"}`}
              />
            )}
            {difficulty && (
              <SummaryRow
                label="규모"
                value={
                  DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)
                    ?.label ?? ""
                }
              />
            )}
            {costRangeIdx >= 0 && (
              <SummaryRow
                label="비용 범위"
                value={COST_OPTIONS[costRangeIdx].label}
              />
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-2 pt-2">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={15} />
            이전
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            취소
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
            disabled={
              step === 1
                ? !canProceedStep1
                : step === 2
                  ? !canProceedStep2
                  : false
            }
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                {isEditMode ? "수정 저장" : "포트폴리오 저장"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground flex-1">{value}</span>
    </div>
  );
}
