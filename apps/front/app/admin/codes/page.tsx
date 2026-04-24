"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getAdminCodes,
  createAdminCode,
  updateAdminCode,
  deleteAdminCode,
  reorderAdminCodes,
  type AdminCode,
} from "@/lib/api";

const CODE_GROUPS = ["FIELD", "EXP", "BIZ", "AREA"];

export default function AdminCodesPage() {
  const [selectedGroup, setSelectedGroup] = useState("FIELD");
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 새 코드 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState({ code: "", name: "" });

  // 인라인 편집
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminCodes(selectedGroup)
      .then(setCodes)
      .catch(() => setError("코드 목록을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [selectedGroup]);

  useEffect(() => {
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = codes.findIndex((c) => c.code === active.id);
    const newIndex = codes.findIndex((c) => c.code === over.id);
    const reordered = arrayMove(codes, oldIndex, newIndex).map((c, idx) => ({
      ...c,
      sortOrder: idx,
    }));
    setCodes(reordered);

    setSaving(true);
    try {
      await reorderAdminCodes(
        reordered.map((c) => ({ code: c.code, sortOrder: c.sortOrder ?? 0 })),
      );
    } catch {
      alert("정렬 저장에 실패했습니다");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.code.trim() || !newCode.name.trim()) return;
    setSaving(true);
    try {
      await createAdminCode({
        code: newCode.code.toUpperCase(),
        group: selectedGroup,
        name: newCode.name,
        sortOrder: codes.length,
      });
      setNewCode({ code: "", name: "" });
      setShowAddForm(false);
      load();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "코드 생성에 실패했습니다";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async (code: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateAdminCode(code, { name: editName });
      setEditingCode(null);
      load();
    } catch {
      alert("수정에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`"${code}" 코드를 삭제하시겠습니까?`)) return;
    setSaving(true);
    try {
      await deleteAdminCode(code);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "삭제에 실패했습니다";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">코드 관리</h1>
        {saving && (
          <span className="text-xs text-muted-foreground">저장 중...</span>
        )}
      </div>

      {/* 그룹 탭 */}
      <div className="flex gap-1 flex-wrap">
        {CODE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => {
              setSelectedGroup(group);
              setShowAddForm(false);
              setEditingCode(null);
            }}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              selectedGroup === group
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* 코드 목록 (DnD) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">
            {codes.length}개 코드 — 드래그로 순서 변경
          </p>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + 코드 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="flex gap-2 items-center px-4 py-3 border-b border-border bg-muted/10"
          >
            <input
              type="text"
              value={newCode.code}
              onChange={(e) =>
                setNewCode((v) => ({
                  ...v,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="코드 (예: FLD_NEW)"
              className="px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground w-36 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <input
              type="text"
              value={newCode.name}
              onChange={(e) =>
                setNewCode((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="표시 이름"
              className="px-2 py-1.5 rounded border border-border bg-background text-sm text-foreground flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              취소
            </button>
          </form>
        )}

        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : codes.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            코드가 없습니다
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={codes.map((c) => c.code)}
              strategy={verticalListSortingStrategy}
            >
              {codes.map((code) => (
                <SortableCodeRow
                  key={code.code}
                  code={code}
                  isEditing={editingCode === code.code}
                  editName={editName}
                  onEditStart={() => {
                    setEditingCode(code.code);
                    setEditName(code.name);
                  }}
                  onEditChange={setEditName}
                  onEditSave={() => handleUpdateName(code.code)}
                  onEditCancel={() => setEditingCode(null)}
                  onDelete={() => handleDelete(code.code)}
                  disabled={saving}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SortableCodeRow({
  code,
  isEditing,
  editName,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  disabled,
}: {
  code: AdminCode;
  isEditing: boolean;
  editName: string;
  onEditStart: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: code.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 bg-card hover:bg-muted/10 transition-colors"
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        tabIndex={-1}
        aria-label="순서 변경"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="4" cy="3" r="1" fill="currentColor" />
          <circle cx="4" cy="7" r="1" fill="currentColor" />
          <circle cx="4" cy="11" r="1" fill="currentColor" />
          <circle cx="10" cy="3" r="1" fill="currentColor" />
          <circle cx="10" cy="7" r="1" fill="currentColor" />
          <circle cx="10" cy="11" r="1" fill="currentColor" />
        </svg>
      </button>

      <span className="text-xs font-mono text-muted-foreground w-36 shrink-0">
        {code.code}
      </span>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditChange(e.target.value)}
            className="px-2 py-1 rounded border border-primary bg-background text-sm text-foreground flex-1 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
          />
          <button
            onClick={onEditSave}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={onEditCancel}
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            취소
          </button>
        </div>
      ) : (
        <span
          className="flex-1 text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={onEditStart}
          title="클릭하여 편집"
        >
          {code.name}
        </span>
      )}

      <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
        {code.sortOrder ?? 0}
      </span>

      <button
        onClick={onDelete}
        disabled={disabled}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
        title="삭제"
      >
        삭제
      </button>
    </div>
  );
}
