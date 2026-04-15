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
  Home,
  Store,
  HelpCircle,
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
import { ROOM_TYPE_VALUES, type RoomType } from "@repo/constants";

// ── 타입 ───────────────────────────────────────────────────────────────────────
interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;
  imageType: "BEFORE" | "AFTER" | "DETAIL" | null;
}

// RoomType은 @repo/constants에서 import — DB schema의 roomTypeEnum과 동기화됨

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
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

const ROOM_TYPES: RoomType[] = [...ROOM_TYPE_VALUES];

interface RoomGroup {
  tempId: string;
  roomType: RoomType;
  images: UploadedImage[];
}

const MAX_IMAGES_PER_ROOM = 10;
const MAX_TOTAL_IMAGES = 50;

interface Props {
  mode: "create" | "edit";
  workerProfileId: string;
  portfolioId?: string;
  initialData?: GetPortfolioByIdResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Create 모드: 6-step 온보딩 ─────────────────────────────────────────────────
type CreateStep = 1 | 2 | 3 | 4 | 5 | 6;

const CREATE_STEP_LABELS: Record<CreateStep, string> = {
  1: "시공 위치",
  2: "공간 유형",
  3: "세부 정보",
  4: "기간 & 비용",
  5: "시공 사진",
  6: "확인 및 저장",
};

function generateAutoTitle(
  location: string,
  spaceType: string,
  area: string,
  areaUnit: string,
): string {
  const areaStr = area ? ` ${area}${areaUnit === "SQMETER" ? "m²" : "평"}` : "";
  if (spaceType === "RESIDENTIAL")
    return `${location ? location + " " : ""}아파트${areaStr} 시공`.trim();
  if (spaceType === "COMMERCIAL")
    return `${location ? location + " " : ""}상업공간 시공`.trim();
  return "";
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

  // ── 공통 상태 ──────────────────────────────────────────────────────────────

  // Edit 모드 초기 rooms: initialData.rooms + 각 room에 해당 media 바인딩
  const buildInitialRooms = (): RoomGroup[] => {
    if (!initialData || !initialData.rooms?.length) return [];
    return [...initialData.rooms]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((room) => ({
        tempId: room.id, // 기존 room ID를 tempId로 사용
        roomType: room.roomType as RoomType,
        images: initialData.media
          .filter((m) => m.roomId === room.id && m.mediaType === "IMAGE")
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((m) => ({
            file: new File([], m.mediaUrl.split("/").pop() ?? "image"),
            previewUrl: m.mediaUrl,
            uploadedUrl: m.mediaUrl,
            uploading: false,
            error: null,
            imageType:
              (m.imageType as "BEFORE" | "AFTER" | "DETAIL" | null) ?? null,
          })),
      }));
  };

  // Edit 모드에서도 rooms state 사용 (Create와 동일 구조)
  const buildInitialImages = (): UploadedImage[] => {
    if (!initialData) return [];
    // rooms에 속하지 않은 미디어만 flat images로
    const roomIds = new Set(initialData.rooms?.map((r) => r.id) ?? []);
    return initialData.media
      .filter((m) => m.mediaType === "IMAGE" && !roomIds.has(m.roomId ?? ""))
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

  const [location, setLocation] = useState(initialData?.location ?? "");
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
  const [bedroomCount, setBedroomCount] = useState<number | null>(
    initialData?.details?.bedroomCount ?? null,
  );
  const [bathroomCount, setBathroomCount] = useState<number | null>(
    initialData?.details?.bathroomCount ?? null,
  );
  const [constructionScope, setConstructionScope] = useState(
    initialData?.constructionScope ?? "",
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
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
  const [dateError, setDateError] = useState<string | null>(null);
  const [costRangeIdx, setCostRangeIdx] = useState<number>(() => {
    if (!initialData?.estimatedCost) return -1;
    const v = Number(initialData.estimatedCost);
    return COST_OPTIONS.findIndex(
      (o) => Math.abs(o.estimatedValue - v) < v * 0.3,
    );
  });
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "">(
    (initialData?.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined) ?? "",
  );
  const [images, setImages] = useState<UploadedImage[]>(buildInitialImages);
  const [tags, setTags] = useState<string[]>(
    initialData?.tags?.map((t) => t.tagName) ?? [],
  );
  const [warrantyMonths, setWarrantyMonths] = useState(
    initialData?.details?.warrantyMonths?.toString() ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Create 전용 상태 ────────────────────────────────────────────────────────
  const [createStep, setCreateStep] = useState<CreateStep>(1);

  // Create/Edit 공통: 공간별 사진 그룹 (Edit 모드는 initialData.rooms로 초기화)
  const [rooms, setRooms] = useState<RoomGroup[]>(() =>
    isEditMode ? buildInitialRooms() : [],
  );
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  // 공간별 파일 input ref (roomId → ref)
  const roomFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const totalRoomImages = rooms.reduce((sum, r) => sum + r.images.length, 0);

  const addRoom = (roomType: RoomType) => {
    setRooms((prev) => [
      ...prev,
      { tempId: `${roomType}-${Date.now()}`, roomType, images: [] },
    ]);
    setShowRoomPicker(false);
  };

  const removeRoom = (tempId: string) => {
    setRooms((prev) => {
      const room = prev.find((r) => r.tempId === tempId);
      if (room)
        room.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return prev.filter((r) => r.tempId !== tempId);
    });
  };

  const handleRoomFileSelect = useCallback(
    async (tempId: string, files: FileList | null) => {
      if (!files) return;
      const room = rooms.find((r) => r.tempId === tempId);
      if (!room) return;

      const availableSlots = Math.min(
        MAX_IMAGES_PER_ROOM - room.images.length,
        MAX_TOTAL_IMAGES - totalRoomImages,
      );
      if (availableSlots <= 0) return;

      const newImages: UploadedImage[] = Array.from(files)
        .slice(0, availableSlots)
        .map((f) => ({
          file: f,
          previewUrl: URL.createObjectURL(f),
          uploadedUrl: null,
          uploading: true,
          error: null,
          imageType: null,
        }));

      setRooms((prev) =>
        prev.map((r) =>
          r.tempId === tempId
            ? { ...r, images: [...r.images, ...newImages] }
            : r,
        ),
      );

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

      setRooms((prev) =>
        prev.map((r) => {
          if (r.tempId !== tempId) return r;
          const existingNotNew = r.images.filter(
            (p) => !newImages.some((n) => n.previewUrl === p.previewUrl),
          );
          return { ...r, images: [...existingNotNew, ...uploaded] };
        }),
      );
    },
    [rooms, totalRoomImages],
  );

  const removeRoomImage = (tempId: string, imgIdx: number) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const next = [...r.images];
        URL.revokeObjectURL(next[imgIdx].previewUrl);
        next.splice(imgIdx, 1);
        return { ...r, images: next };
      }),
    );
  };

  const setRoomImageType = (
    tempId: string,
    imgIdx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        return {
          ...r,
          images: r.images.map((img, i) =>
            i === imgIdx ? { ...img, imageType: type } : img,
          ),
        };
      }),
    );
  };

  // Step 4 진입 시 자동 제목 생성
  useEffect(() => {
    if (!isEditMode && createStep === 4 && !title) {
      const auto = generateAutoTitle(location, spaceType, area, areaUnit);
      if (auto) setTitle(auto);
    }
  }, [createStep, isEditMode]);

  // ── 이미지 업로드 공통 ──────────────────────────────────────────────────────
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

  const setImageType = (
    idx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, imageType: type } : img)),
    );
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      rooms.forEach((r) =>
        r.images.forEach((img) => URL.revokeObjectURL(img.previewUrl)),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 완성도 점수 ─────────────────────────────────────────────────────────────
  const allRoomImages = rooms.flatMap((r) => r.images);
  const score = (() => {
    let s = 2;
    if (tags.length > 0) s++;
    if (
      allRoomImages.some((i) => i.imageType === "BEFORE") &&
      allRoomImages.some((i) => i.imageType === "AFTER")
    )
      s++;
    if (constructionScope.trim()) s++;
    return Math.min(s, 5);
  })();

  // ── 제출 ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const totalRoomImagesForSubmit = rooms.reduce(
      (sum, r) => sum + r.images.length,
      0,
    );
    if (!title.trim()) return;
    if (totalRoomImagesForSubmit === 0 && images.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create/Edit 공통: rooms 기반 media 구성 (roomIndex로 룸 바인딩)
      // rooms가 있으면 rooms 우선, 없으면 flat images 사용
      let media: CreatePortfolioMediaPayload[];
      let roomsPayload: { roomType: string }[] | undefined;

      if (rooms.length > 0) {
        // 룸별 사진이 있는 경우 (Create/Edit 공통)
        roomsPayload = rooms.map((r) => ({ roomType: r.roomType }));
        media = rooms.flatMap((r, rIdx) =>
          r.images
            .filter((img) => img.uploadedUrl)
            .map((img) => ({
              mediaUrl: img.uploadedUrl!,
              mediaType: "IMAGE" as const,
              imageType: img.imageType ?? undefined,
              roomIndex: rIdx,
            })),
        );
      } else {
        // 룸 없는 경우: flat images (Edit 레거시 데이터 또는 룸 없이 저장)
        const uploadedImages = images.filter((i) => i.uploadedUrl);
        media = uploadedImages.map((img) => ({
          mediaUrl: img.uploadedUrl!,
          mediaType: "IMAGE" as const,
          imageType: img.imageType ?? undefined,
        }));
      }

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
          areaNum ||
          warrantyNum ||
          bedroomCount != null ||
          bathroomCount != null
            ? {
                area: areaNum,
                areaUnit,
                warrantyMonths: warrantyNum,
                bedroomCount: bedroomCount ?? undefined,
                bathroomCount: bathroomCount ?? undefined,
              }
            : undefined,
        tags:
          tags.length > 0 ? tags.map((tagName) => ({ tagName })) : undefined,
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
        rooms: roomsPayload,
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

  // ── Edit 모드: 단일 스크롤 폼 ─────────────────────────────────────────────
  if (isEditMode) {
    return (
      <EditForm
        {...{
          location,
          setLocation,
          spaceType,
          setSpaceType,
          area,
          setArea,
          areaUnit,
          setAreaUnit,
          bedroomCount,
          setBedroomCount,
          bathroomCount,
          setBathroomCount,
          constructionScope,
          setConstructionScope,
          title,
          setTitle,
          startDate,
          setStartDate,
          endDate,
          setEndDate,
          costRangeIdx,
          setCostRangeIdx,
          difficulty,
          setDifficulty,
          images,
          removeImage,
          setImageType,
          handleFileSelect,
          handleDrop,
          fileInputRef,
          rooms,
          showRoomPicker,
          setShowRoomPicker,
          addRoom,
          removeRoom,
          handleRoomFileSelect,
          removeRoomImage,
          setRoomImageType,
          roomFileInputRefs,
          tags,
          toggleTag,
          warrantyMonths,
          setWarrantyMonths,
          dateError,
          setDateError,
          submitting,
          error,
          onCancel,
          handleSubmit,
        }}
      />
    );
  }

  // ── Create 모드: 6-step 온보딩 ─────────────────────────────────────────────
  const canProceed: Record<CreateStep, boolean> = {
    1: true,
    2: spaceType !== "",
    3: true,
    4: dateError === null,
    5:
      rooms.length > 0 &&
      rooms.every((r) => r.images.length > 0) &&
      rooms.every((r) => r.images.every((i) => !i.uploading)),
    6: title.trim().length >= 5,
  };

  const goNext = () => {
    if (createStep < 6) setCreateStep((s) => (s + 1) as CreateStep);
  };
  const goPrev = () => {
    if (createStep > 1) setCreateStep((s) => (s - 1) as CreateStep);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 진행바 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          {([1, 2, 3, 4, 5, 6] as CreateStep[]).map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s < createStep
                  ? "flex-1 bg-primary/40"
                  : s === createStep
                    ? "flex-[2] bg-primary"
                    : "flex-1 bg-border"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            {CREATE_STEP_LABELS[createStep]}
          </p>
          <span className="text-xs text-muted-foreground">
            {createStep} / 6
          </span>
        </div>
      </div>

      {/* ── Step 1: 위치 ── */}
      {createStep === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              어디서 시공했나요?
            </h2>
            <p className="text-sm text-muted-foreground">
              고객이 지역으로 검색할 때 찾을 수 있어요.
            </p>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울 마포구, 강남 아파트 등"
            maxLength={200}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            선택사항 — 나중에 입력해도 됩니다.
          </p>
        </div>
      )}

      {/* ── Step 2: 공간 유형 ── */}
      {createStep === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              어떤 공간이었나요?
            </h2>
            <p className="text-sm text-muted-foreground">
              공간 유형을 선택하면 맞춤 정보를 입력할 수 있어요.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {(
              [
                {
                  value: "RESIDENTIAL",
                  icon: Home,
                  label: "주거 공간",
                  desc: "아파트, 빌라, 단독주택",
                },
                {
                  value: "COMMERCIAL",
                  icon: Store,
                  label: "상업 공간",
                  desc: "식당, 카페, 사무실, 매장",
                },
                {
                  value: "OTHER",
                  icon: HelpCircle,
                  label: "기타",
                  desc: "공장, 창고, 특수 공간 등",
                },
              ] as const
            ).map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                onClick={() => {
                  setSpaceType(value);
                  // 선택 즉시 다음 스텝으로
                  setTimeout(() => setCreateStep(3), 120);
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  spaceType === value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    spaceType === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: 세부 정보 (공간 유형별 conditional) ── */}
      {createStep === 3 && (
        <div className="flex flex-col gap-5">
          {spaceType === "RESIDENTIAL" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  몇 평 규모였나요?
                </h2>
                <p className="text-sm text-muted-foreground">
                  평수 정보가 있으면 고객 신뢰도가 높아져요.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  평형대 (선택)
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
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <div className="flex gap-1">
                    {(["PYEONG", "SQMETER"] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setAreaUnit(unit)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
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
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  방 수 (선택)
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setBedroomCount((v) => (v === n ? null : n))
                      }
                      className={`w-10 h-10 rounded-xl text-sm font-medium border transition-colors ${
                        bedroomCount === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  욕실 수 (선택)
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setBathroomCount((v) => (v === n ? null : n))
                      }
                      className={`w-10 h-10 rounded-xl text-sm font-medium border transition-colors ${
                        bathroomCount === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {n === 4 ? "4+" : n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {spaceType === "COMMERCIAL" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  공사 내용을 알려주세요
                </h2>
                <p className="text-sm text-muted-foreground">
                  어떤 시공을 했는지 간단히 적어주세요.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  평형대 (선택)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="예: 50"
                    min={0}
                    max={9999}
                    step={1}
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <div className="flex gap-1">
                    {(["PYEONG", "SQMETER"] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setAreaUnit(unit)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
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
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  시공 범위 (선택)
                </label>
                <textarea
                  value={constructionScope}
                  onChange={(e) => setConstructionScope(e.target.value)}
                  placeholder="예: 욕실 타일 전체 교체, 바닥+벽 포함"
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
            </>
          )}

          {spaceType === "OTHER" && (
            <>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  포트폴리오 제목을 입력해주세요
                </h2>
                <p className="text-sm text-muted-foreground">
                  어떤 시공인지 한 줄로 설명해주세요.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  제목 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 공장 바닥 에폭시 코팅 시공"
                  maxLength={100}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  시공 범위 (선택)
                </label>
                <textarea
                  value={constructionScope}
                  onChange={(e) => setConstructionScope(e.target.value)}
                  placeholder="어떤 공사를 했는지 간단히 적어주세요."
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 4: 기간 & 비용 + 제목 확인 ── */}
      {createStep === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              시공은 언제, 얼마였나요?
            </h2>
            <p className="text-sm text-muted-foreground">
              모두 선택사항입니다.
            </p>
          </div>

          {/* 제목 (자동 생성 + 수정 가능) */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              포트폴리오 제목{" "}
              {spaceType !== "OTHER" && (
                <span className="font-normal text-muted-foreground/70">
                  (자동 생성됨, 수정 가능)
                </span>
              )}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 마포구 아파트 32평 시공"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
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
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value && e.target.value > endDate) {
                    setDateError("종료일이 시작일보다 빠를 수 없습니다");
                  } else {
                    setDateError(null);
                  }
                }}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <span className="text-muted-foreground text-sm">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (
                    startDate &&
                    e.target.value &&
                    e.target.value < startDate
                  ) {
                    setDateError("종료일이 시작일보다 빠를 수 없습니다");
                  } else {
                    setDateError(null);
                  }
                }}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            {dateError && (
              <p className="text-xs text-destructive mt-1.5">{dateError}</p>
            )}
          </div>

          {/* 비용 범위 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              비용 범위 (선택)
            </p>
            <div className="flex flex-wrap gap-2">
              {COST_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setCostRangeIdx((v) => (v === idx ? -1 : idx))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
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

          {/* 공사 규모 */}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
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
        </div>
      )}

      {/* ── Step 5: 사진 (공간별 모음집) ── */}
      {createStep === 5 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              공간별로 사진을 올려주세요
            </h2>
            <p className="text-sm text-muted-foreground">
              공간을 추가하고 각 공간의 시공 사진을 넣어주세요. 공간당 최대
              10장, 총 {totalRoomImages}/{MAX_TOTAL_IMAGES}장.
            </p>
          </div>

          {/* 공간 목록 */}
          {rooms.map((room) => (
            <div
              key={room.tempId}
              className="border border-border rounded-xl overflow-hidden"
            >
              {/* 공간 헤더 */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-secondary">
                <span className="text-sm font-semibold text-foreground">
                  {ROOM_TYPE_LABELS[room.roomType]}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {room.images.length}/{MAX_IMAGES_PER_ROOM}장
                  </span>
                </span>
                <button
                  onClick={() => removeRoom(room.tempId)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 사진 그리드 */}
              <div className="p-3 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {room.images.map((img, imgIdx) => (
                    <div
                      key={img.previewUrl}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary"
                    >
                      <Image
                        src={img.previewUrl}
                        alt={`${ROOM_TYPE_LABELS[room.roomType]} 사진 ${imgIdx + 1}`}
                        fill
                        className="object-cover"
                      />
                      {img.uploading && (
                        <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                          <Loader2
                            size={16}
                            className="text-primary-foreground animate-spin"
                          />
                        </div>
                      )}
                      {!img.uploading && (
                        <button
                          onClick={() => removeRoomImage(room.tempId, imgIdx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-foreground/70 rounded-full flex items-center justify-center text-primary-foreground hover:bg-destructive transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* 사진 추가 버튼 */}
                  {room.images.length < MAX_IMAGES_PER_ROOM &&
                    totalRoomImages < MAX_TOTAL_IMAGES && (
                      <button
                        onClick={() =>
                          roomFileInputRefs.current[room.tempId]?.click()
                        }
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Upload size={16} />
                        <span className="text-xs">추가</span>
                      </button>
                    )}
                  <input
                    ref={(el) => {
                      roomFileInputRefs.current[room.tempId] = el;
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      handleRoomFileSelect(room.tempId, e.target.files)
                    }
                  />
                </div>

                {/* 비포/애프터 태그 */}
                {room.images.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {room.images.map((img, imgIdx) => (
                      <div
                        key={img.previewUrl}
                        className="flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-md overflow-hidden border border-border flex-shrink-0">
                          <Image
                            src={img.previewUrl}
                            alt={`사진 ${imgIdx + 1}`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
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
                                setRoomImageType(
                                  room.tempId,
                                  imgIdx,
                                  img.imageType === value ? null : value,
                                )
                              }
                              className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
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
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 공간 추가 */}
          {totalRoomImages < MAX_TOTAL_IMAGES && (
            <div className="relative">
              <button
                onClick={() => setShowRoomPicker((v) => !v)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Upload size={16} />
                공간 추가
              </button>
              {showRoomPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 p-2 grid grid-cols-3 gap-1">
                  {ROOM_TYPES.map((rt) => (
                    <button
                      key={rt}
                      onClick={() => addRoom(rt)}
                      className="px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-secondary transition-colors text-center"
                    >
                      {ROOM_TYPE_LABELS[rt]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {rooms.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              위 버튼을 눌러 공간을 추가하세요.
            </p>
          )}
        </div>
      )}

      {/* ── Step 6: 확인 ── */}
      {createStep === 6 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              이렇게 저장할까요?
            </h2>
          </div>

          {/* 완성도 */}
          <div className="bg-secondary rounded-xl p-4 border border-border">
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
              value={`${allRoomImages.filter((i) => i.uploadedUrl).length}장 (${rooms.length}개 공간)`}
            />
            {location && <SummaryRow label="위치" value={location} />}
            {spaceType && (
              <SummaryRow
                label="공간 유형"
                value={SPACE_TYPE_LABEL[spaceType]}
              />
            )}
            {area && (
              <SummaryRow
                label="평형"
                value={`${area}${areaUnit === "SQMETER" ? "m²" : "평"}`}
              />
            )}
            {bedroomCount != null && (
              <SummaryRow label="방 수" value={`${bedroomCount}개`} />
            )}
            {bathroomCount != null && (
              <SummaryRow label="욕실 수" value={`${bathroomCount}개`} />
            )}
            {(startDate || endDate) && (
              <SummaryRow
                label="시공 기간"
                value={`${startDate || "?"} ~ ${endDate || "?"}`}
              />
            )}
            {costRangeIdx >= 0 && (
              <SummaryRow
                label="비용 범위"
                value={COST_OPTIONS[costRangeIdx].label}
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
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex gap-2">
          {createStep > 1 ? (
            <button
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={15} />
              이전
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              취소
            </button>
          )}

          {createStep < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed[createStep]}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createStep === 2 ? "선택 완료" : "다음"}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed[6]}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

        {/* 건너뛰기 — 주 버튼 아래 별도 행으로 분리해 시인성 확보 */}
        {(createStep === 1 || createStep === 3 || createStep === 4) && (
          <button
            onClick={goNext}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
          >
            이 단계 건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}

// ── Edit 모드: 단일 스크롤 폼 ──────────────────────────────────────────────────
interface EditFormProps {
  location: string;
  setLocation: (v: string) => void;
  spaceType: "RESIDENTIAL" | "COMMERCIAL" | "OTHER" | "";
  setSpaceType: (v: "RESIDENTIAL" | "COMMERCIAL" | "OTHER" | "") => void;
  area: string;
  setArea: (v: string) => void;
  areaUnit: "PYEONG" | "SQMETER";
  setAreaUnit: (v: "PYEONG" | "SQMETER") => void;
  bedroomCount: number | null;
  setBedroomCount: (v: number | null) => void;
  bathroomCount: number | null;
  setBathroomCount: (v: number | null) => void;
  constructionScope: string;
  setConstructionScope: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  costRangeIdx: number;
  setCostRangeIdx: (v: number | ((prev: number) => number)) => void;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "";
  setDifficulty: (
    v:
      | "EASY"
      | "MEDIUM"
      | "HARD"
      | ((
          prev: "EASY" | "MEDIUM" | "HARD" | "",
        ) => "EASY" | "MEDIUM" | "HARD" | ""),
  ) => void;
  images: UploadedImage[];
  removeImage: (idx: number) => void;
  setImageType: (
    idx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => void;
  handleFileSelect: (files: FileList | null) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  // 룸별 사진 (Edit 모드에서도 사용)
  rooms: RoomGroup[];
  showRoomPicker: boolean;
  setShowRoomPicker: (v: boolean) => void;
  addRoom: (roomType: RoomType) => void;
  removeRoom: (tempId: string) => void;
  handleRoomFileSelect: (
    tempId: string,
    files: FileList | null,
  ) => Promise<void>;
  removeRoomImage: (tempId: string, imgIdx: number) => void;
  setRoomImageType: (
    tempId: string,
    imgIdx: number,
    type: "BEFORE" | "AFTER" | "DETAIL" | null,
  ) => void;
  roomFileInputRefs: React.RefObject<Record<string, HTMLInputElement | null>>;
  tags: string[];
  toggleTag: (tag: string) => void;
  warrantyMonths: string;
  setWarrantyMonths: (v: string) => void;
  dateError: string | null;
  setDateError: (v: string | null) => void;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  handleSubmit: () => void;
}

function EditForm({
  location,
  setLocation,
  spaceType,
  setSpaceType,
  area,
  setArea,
  areaUnit,
  setAreaUnit,
  bedroomCount,
  setBedroomCount,
  bathroomCount,
  setBathroomCount,
  constructionScope,
  setConstructionScope,
  title,
  setTitle,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  costRangeIdx,
  setCostRangeIdx,
  difficulty,
  setDifficulty,
  images,
  removeImage,
  setImageType,
  handleFileSelect,
  handleDrop,
  fileInputRef,
  rooms,
  showRoomPicker,
  setShowRoomPicker,
  addRoom,
  removeRoom,
  handleRoomFileSelect,
  removeRoomImage,
  setRoomImageType,
  roomFileInputRefs,
  tags,
  toggleTag,
  warrantyMonths,
  setWarrantyMonths,
  dateError,
  setDateError,
  submitting,
  error,
  onCancel,
  handleSubmit,
}: EditFormProps) {
  const totalRoomImages = rooms.reduce((sum, r) => sum + r.images.length, 0);
  return (
    <div className="flex flex-col gap-8">
      {/* ── 섹션 1: 기본 정보 ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          기본 정보
        </h3>

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
        </div>

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

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            공간 유형
          </p>
          <div className="flex gap-2">
            {(["RESIDENTIAL", "COMMERCIAL", "OTHER"] as const).map((type) => (
              <button
                key={type}
                onClick={() =>
                  setSpaceType(
                    (v: "RESIDENTIAL" | "COMMERCIAL" | "OTHER" | "") =>
                      v === type ? "" : type,
                  )
                }
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
      </section>

      <div className="h-px bg-border" />

      {/* ── 섹션 2: 세부 정보 ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          세부 정보
        </h3>

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

        {(spaceType === "RESIDENTIAL" || spaceType === "") && (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                방 수
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBedroomCount((v) => (v === n ? null : n))}
                    className={`w-10 h-10 rounded-md text-sm font-medium border transition-colors ${
                      bedroomCount === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {n === 5 ? "5+" : n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                욕실 수
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setBathroomCount((v) => (v === n ? null : n))
                    }
                    className={`w-10 h-10 rounded-md text-sm font-medium border transition-colors ${
                      bathroomCount === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

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
      </section>

      <div className="h-px bg-border" />

      {/* ── 섹션 3: 기간 & 비용 ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          기간 & 비용
        </h3>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            시공 기간
          </p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value && e.target.value > endDate) {
                  setDateError("종료일이 시작일보다 빠를 수 없습니다");
                } else {
                  setDateError(null);
                }
              }}
              className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <span className="text-muted-foreground text-sm">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (startDate && e.target.value && e.target.value < startDate) {
                  setDateError("종료일이 시작일보다 빠를 수 없습니다");
                } else {
                  setDateError(null);
                }
              }}
              className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          {dateError && (
            <p className="text-xs text-destructive mt-1.5">{dateError}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            비용 범위
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

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            공사 규모
          </p>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() =>
                  setDifficulty((v: "EASY" | "MEDIUM" | "HARD" | "") =>
                    v === value ? "" : value,
                  )
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
      </section>

      <div className="h-px bg-border" />

      {/* ── 섹션 4: 사진 ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          시공 사진
        </h3>

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
          <>
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

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                비포/애프터 지정
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
          </>
        )}
      </section>

      <div className="h-px bg-border" />

      {/* ── 섹션 5: 자재 & A/S ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          자재 & A/S
        </h3>

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
      </section>

      {error && (
        <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || dateError !== null}
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
              수정 저장
            </>
          )}
        </button>
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
