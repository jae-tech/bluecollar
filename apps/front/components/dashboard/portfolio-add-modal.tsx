"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Upload,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  uploadFile,
  createPortfolio,
  type CreatePortfolioMediaPayload,
} from "@/lib/api";

// ── 자재 카테고리 ──────────────────────────────────────────────────────────────
const MATERIAL_CATEGORIES = [
  "바닥재",
  "벽재",
  "천장재",
  "타일",
  "도배",
  "줄눈/접착제",
  "페인트",
  "조명",
  "창호",
  "위생도기",
  "전기자재",
  "배관자재",
  "기타",
] as const;

// ── 비용 범위 옵션 ──────────────────────────────────────────────────────────────
const COST_OPTIONS = [
  { label: "100만원 미만", min: 0, max: 100 },
  { label: "100~300만원", min: 100, max: 300 },
  { label: "300~500만원", min: 300, max: 500 },
  { label: "500만원~1천만원", min: 500, max: 1000 },
  { label: "1천만원~3천만원", min: 1000, max: 3000 },
  { label: "3천만원 이상", min: 3000, max: 99999 },
];

// ── 공종 카테고리 ──────────────────────────────────────────────────────────────
const DIFFICULTY_OPTIONS = [
  { label: "간단", value: "EASY" as const },
  { label: "보통", value: "MEDIUM" as const },
  { label: "복잡", value: "HARD" as const },
];

// ── 타입 ───────────────────────────────────────────────────────────────────────
interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
  imageType: "BEFORE" | "AFTER" | "DETAIL" | null;
}

interface Material {
  category: string;
  productName: string;
}

interface Props {
  workerProfileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PortfolioAddModal({
  workerProfileId,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialCat, setMaterialCat] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "">(
    "",
  );
  const [costRange, setCostRange] = useState<number>(-1);
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

      // 병렬 업로드
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

  const setImageType = (
    idx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, imageType: type } : img)),
    );
  };

  // ── 자재 추가 ────────────────────────────────────────────────────────────────
  const addMaterial = () => {
    if (!materialCat || !materialName.trim()) return;
    setMaterials((prev) => [
      ...prev,
      { category: materialCat, productName: materialName.trim() },
    ]);
    setMaterialName("");
  };

  const removeMaterial = (idx: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── 완성도 점수 ──────────────────────────────────────────────────────────────
  const completenessScore = () => {
    let score = 2; // 사진 + 제목
    const hasMaterial = materials.length > 0;
    const hasBefore = images.some((i) => i.imageType === "BEFORE");
    const hasAfter = images.some((i) => i.imageType === "AFTER");
    if (hasMaterial) score++;
    if (hasBefore && hasAfter) score++;
    if (description.trim()) score++;
    return Math.min(score, 5);
  };

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
          description:
            materials
              .map((m) => `${m.category}: ${m.productName}`)
              .join(", ") || undefined,
        }),
      );

      const cost = costRange >= 0 ? COST_OPTIONS[costRange] : null;

      await createPortfolio({
        workerProfileId,
        title: title.trim(),
        content: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        difficulty: difficulty || undefined,
        estimatedCost: cost?.min ? cost.min * 10000 : undefined,
        actualCost:
          cost?.max && cost.max < 99999 ? cost.max * 10000 : undefined,
        costVisibility: cost ? "PUBLIC" : "PRIVATE",
        media,
      });

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

  // 모달 언마운트 시 blob URL 전체 해제
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceedStep1 =
    images.length > 0 && images.every((i) => !i.uploading);
  // API 최소 제목 길이 5자
  const canProceedStep2 = title.trim().length >= 5;
  const score = completenessScore();

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-foreground/40"
        style={{ backdropFilter: "blur(2px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="w-full max-w-lg bg-card border border-border rounded-t-lg sm:rounded-lg overflow-hidden flex flex-col max-h-[92vh]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  포트폴리오 추가
                </h2>
                <p className="text-xs text-muted-foreground">
                  {step === 1 && "사진 선택"}
                  {step === 2 && "기본 정보 입력"}
                  {step === 3 && "상세 정보 (선택)"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* 진행 바 */}
          <div className="h-1 bg-secondary flex-shrink-0">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {/* Step 1: 사진 */}
            {step === 1 && (
              <div className="p-5">
                <p className="text-sm font-semibold text-foreground mb-3">
                  시공 사진을 업로드해주세요
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  최대 10장. JPEG, PNG, WebP 지원. 장당 최대 50MB.
                </p>

                {/* 드롭존 */}
                {images.length < 10 && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-md p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer mb-4"
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

                {/* 이미지 그리드 */}
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
                        {img.error && (
                          <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                            <span className="text-xs text-white font-medium px-1">
                              {img.error}
                            </span>
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

            {/* Step 2: 기본 정보 */}
            {step === 2 && (
              <div className="p-5 flex flex-col gap-5">
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

                {/* 비포/애프터 지정 */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    비포/애프터 지정 (선택)
                  </p>
                  <div className="flex flex-col gap-2">
                    {images.slice(0, 6).map((img, idx) => (
                      <div
                        key={img.previewUrl}
                        className="flex items-center gap-3"
                      >
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

                {/* 상세 정보 확장 토글 */}
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <span>
                    {showAdvanced ? "상세 정보 접기" : "+ 상세 정보 추가"}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                  />
                </button>

                {showAdvanced && (
                  <div className="flex flex-col gap-4 border-t border-border pt-4">
                    {/* 자재 */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        사용 자재
                      </p>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={materialCat}
                          onChange={(e) => setMaterialCat(e.target.value)}
                          className="px-2.5 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors flex-shrink-0"
                        >
                          <option value="">카테고리</option>
                          {MATERIAL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={materialName}
                          onChange={(e) => setMaterialName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addMaterial()}
                          placeholder="제품명 입력"
                          className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        />
                        <button
                          onClick={addMaterial}
                          disabled={!materialCat || !materialName.trim()}
                          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
                        >
                          추가
                        </button>
                      </div>
                      {materials.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {materials.map((m, idx) => (
                            <span
                              key={idx}
                              className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-md border border-border"
                            >
                              <span className="text-muted-foreground">
                                {m.category}
                              </span>
                              <span className="font-medium">
                                {m.productName}
                              </span>
                              <button
                                onClick={() => removeMaterial(idx)}
                                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 공기 */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        시공 기간
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
                        공사 규모
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
                        비용 범위 (공개)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {COST_OPTIONS.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              setCostRange((v) => (v === idx ? -1 : idx))
                            }
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                              costRange === idx
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 설명 */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        시공 설명 (선택)
                      </p>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="시공 내용, 특이사항, 고객 요청 사항 등을 자유롭게 적어주세요."
                        maxLength={2000}
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {description.length}/2000
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: 확인 */}
            {step === 3 && (
              <div className="p-5">
                <p className="text-sm font-semibold text-foreground mb-4">
                  입력 내용 확인
                </p>

                {/* 완성도 배지 */}
                <div className="bg-secondary rounded-md p-4 mb-5 border border-border">
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
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          i < score ? "bg-primary" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {score < 3 &&
                      "자재 정보나 비포/애프터 사진을 추가하면 신뢰도가 높아져요."}
                    {score === 3 && "좋아요! 비포/애프터를 추가하면 더 좋아요."}
                    {score === 4 &&
                      "훌륭해요! 조금만 더 채우면 최고 등급이에요."}
                    {score === 5 && "완벽한 포트폴리오입니다!"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <SummaryRow label="제목" value={title} />
                  <SummaryRow
                    label="사진"
                    value={`${images.filter((i) => i.uploadedUrl).length}장`}
                  />
                  {materials.length > 0 && (
                    <SummaryRow
                      label="자재"
                      value={materials
                        .map((m) => `${m.category} - ${m.productName}`)
                        .join(", ")}
                    />
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
                  {costRange >= 0 && (
                    <SummaryRow
                      label="비용 범위"
                      value={COST_OPTIONS[costRange].label}
                    />
                  )}
                  {images.some((i) => i.imageType === "BEFORE") && (
                    <SummaryRow
                      label="비포/애프터"
                      value={`비포 ${images.filter((i) => i.imageType === "BEFORE").length}장, 애프터 ${images.filter((i) => i.imageType === "AFTER").length}장`}
                    />
                  )}
                </div>

                {error && (
                  <div className="mt-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-5 py-4 border-t border-border flex-shrink-0">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    포트폴리오 저장
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
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
