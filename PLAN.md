<!-- /autoplan restore point: /c/Users/heo/.gstack/projects/jae-tech-bluecollar/main-autoplan-restore-20260430-200723.md -->

# Plan: UX Polish · 백엔드 품질 스프린트

**Branch:** main
**Date:** 2026-04-30
**Status:** APPROVED — CEO + Design + Eng 완료. 구현 시작 가능.

---

## Problem Statement

이전 스프린트(포트폴리오 모달 완성 + /review)가 완료됨.

남은 TODO 중 XS~S 규모 항목이 두 가지 패턴으로 묶임:

1. **사용자 직접 경험 (프론트엔드)**: TODO-002, TODO-006, TODO-024 — 페이지 로딩 시 스피너 깜빡임, 버튼 스타일 불일관, radius 계층 위반.
2. **백엔드 데이터 무결성**: TODO-SCHED-002 — `field_code`가 아무 값이나 저장될 수 있음.

가치 대비 구현 비용이 모두 XS~S.

**점검 대상:**
- `apps/front/components/hero-section.tsx` — TODO-002 hero button
- `apps/front/app/worker/[slug]/page.tsx` — TODO-006 Skeleton
- `apps/front/app/onboarding/complete/page.tsx` — TODO-024 radius
- `apps/api/src/domains/work-schedule/dtos/work-schedule.dto.ts` — TODO-SCHED-002
- `apps/front/lib/field-codes.ts` — VALID_FIELD_CODES 파생 소스

---

## Scope

### In scope

**프론트엔드 UX (P1~P2):**
- TODO-002: `hero-section.tsx:66` primary CTA `<button>` → shadcn `<Button>` (미니카드 버튼 제외 — 복잡한 flex 레이아웃)
- TODO-006: `/worker/[slug]` 스피너 → Skeleton (avatar 56px 원형, 이름 2줄, meta row, field tags 3개, portfolio 2×2 grid)
- TODO-024: `onboarding/complete/page.tsx` radius 정비
  - line 97: copy button `rounded-lg` → `rounded-sm` (버튼은 `--radius-sm`)
  - line 117: CTA button `rounded-md` → `rounded-sm`
  - worker/[slug] notFound 분기 line 139, 145: `rounded-md` → `rounded-sm`

**백엔드 품질 (P2):**
- TODO-SCHED-002: `fieldCode` Zod 강화
  - `field-codes.ts`에 `export const VALID_FIELD_CODES = Object.keys(FIELD_CODE_LABELS) as [string, ...string[]]` 추가
  - `CreateWorkScheduleSchema`, `UpdateWorkScheduleSchema` 양쪽 fieldCode → `z.enum(VALID_FIELD_CODES)`
  - `work-schedule.service.spec.ts` fixture를 실제 enum 값(`FLD_TILE` 등)으로 업데이트

**삭제된 TODO:**
- TODO-026: dashboard slug 배너 — `page.tsx:96-99`에서 slug 없으면 `/onboarding/slug`로 즉시 redirect. 배너가 렌더될 경로 없음. TODOS.md에서 완료 처리.
- TODO-079: DB 쿼리 — 코드 변경 없는 모니터링 태스크. 별도 실행.

### Not in scope (defer)
- TODO-034: warrantyMonths 검색 필터 (데이터 축적 후)
- TODO-039: SEO 전략 (팀 논의 필요)
- TODO-040: Analytics 인프라 (별도 결정)
- `siteAddress` / date regex 강화 (인시던트 없음, defer)
- hero 미니카드 버튼 `<Button>` 전환 (복잡한 내부 레이아웃, defer)

---

## Sub-problems → Existing Code Mapping

| Sub-problem | 파일 | 현재 상태 |
|-------------|------|-----------|
| hero primary CTA | `components/hero-section.tsx:66` | raw `<button>`, 인라인 className |
| worker Skeleton | `app/worker/[slug]/page.tsx:97-103` | spinner만 |
| notFound 버튼 radius | `app/worker/[slug]/page.tsx:139,145` | `rounded-md` → `rounded-sm` |
| onboarding copy button | `app/onboarding/complete/page.tsx:97` | `rounded-lg` → `rounded-sm` |
| onboarding CTA button | `app/onboarding/complete/page.tsx:117` | `rounded-md` → `rounded-sm` |
| VALID_FIELD_CODES | `apps/front/lib/field-codes.ts` | 없음 — `Object.keys()` 파생 |
| fieldCode enum DTO | `work-schedule/dtos/work-schedule.dto.ts:13,41` | `z.string().min(1).max(50)` |
| spec fixture | `work-schedule.service.spec.ts` | fieldCode 값 미확인 |

---

## Implementation Specs

### TODO-002: hero-section.tsx primary CTA

```tsx
// Before (line 66):
<button
  onClick={onSignupClick}
  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-6 py-3 rounded-md hover:bg-primary/90 active:scale-95 transition-colors"
>
  무료로 시작하기
  <svg ...>...</svg>
</button>

// After:
import { Button } from "@/components/ui/button";

<Button onClick={onSignupClick} size="lg" className="rounded-sm font-bold active:scale-95">
  무료로 시작하기
  <svg ...>...</svg>
</Button>
```

- `size="lg"`: `h-10 px-6` — 기존 `px-6 py-3`와 근접
- `rounded-sm` override: shadcn Button 기본이 `rounded-md`이므로 DESIGN.md 버튼 규칙(`rounded-sm`) 적용
- SVG는 `currentColor`이므로 Button 내부에서도 동작

### TODO-006: Skeleton 레이아웃

```tsx
// loading 분기를 spinner → Skeleton으로 교체
import { Skeleton } from "@/components/ui/skeleton";

if (loading) {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-40 bg-background/95 border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-5 pb-24">
        {/* Identity */}
        <section className="pt-10 pb-8">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {/* Career summary */}
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-5" />
          {/* Meta row */}
          <Skeleton className="h-3 w-56 mb-5" />
          {/* Field tags */}
          <div className="flex gap-1.5 mb-6">
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-14 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        </section>
        {/* Portfolio grid */}
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-md mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

### TODO-SCHED-002: fieldCode Zod enum

```ts
// apps/front/lib/field-codes.ts에 추가:
export const VALID_FIELD_CODES = Object.keys(FIELD_CODE_LABELS) as [string, ...string[]];

// apps/api/src/domains/work-schedule/dtos/work-schedule.dto.ts:
import { VALID_FIELD_CODES } from '@repo/database'; // 또는 로컬 상수 파일로 분리

// CreateWorkScheduleSchema:
fieldCode: z.enum(VALID_FIELD_CODES, { errorMap: () => ({ message: '유효하지 않은 공정 코드입니다' }) }),

// UpdateWorkScheduleSchema:
fieldCode: z.enum(VALID_FIELD_CODES, { errorMap: () => ({ message: '유효하지 않은 공정 코드입니다' }) }).optional(),
```

**주의:** `VALID_FIELD_CODES`가 프론트(`apps/front/lib/field-codes.ts`)에 있고 백엔드 DTO에서 직접 import 불가. 두 가지 옵션:
- **Option A (권장)**: 백엔드 DTO에 `VALID_FIELD_CODES` 배열을 인라인으로 정의 (21개 값, DTO 파일 내 `const VALID_FIELD_CODES = ['FLD_DEMOLITION', ...] as const`)
- **Option B**: `@repo/schema`에 공유 상수 추가 (더 깔끔하지만 패키지 변경 필요)

스프린트 범위: Option A 사용, `TODO: @repo/schema로 이전` 주석 추가.

---

## Error & Rescue Registry

| 코드패스 | 실패 케이스 | 현재 처리 | Gap |
|---------|------------|-----------|-----|
| fieldCode 검증 (DTO) | `FLD_INVALID` 등 가비지 값 전달 | silent success, DB 저장 | z.enum 가드 추가 필요 |
| hero Button SVG | icon 렌더 안됨 | N/A | currentColor 동작 확인 필요 |
| Skeleton CLS | 실제 콘텐츠와 높이 불일치 | N/A | 구조 일치 검증 필요 |

## Failure Modes Registry

| 실패 모드 | 심각도 | 발생 확률 | 완화 방안 |
|----------|-------|---------|---------|
| fieldCode 가비지 저장 | MED | Low | z.enum (TODO-SCHED-002) |
| Skeleton → 콘텐츠 레이아웃 시프트 | LOW | Med | 구조 일치 확인 |
| Button className 충돌 | LOW | Low | tailwind-merge 자동 처리 |

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 1 | CEO/Premise | TODO-026 삭제 — dashboard redirect가 이미 처리 | Mechanical | P3 | `page.tsx:96-99` redirect 확인. 배너 렌더 경로 없음 | 배너 구현 |
| 2 | CEO/Premise | TODO-SCHED-002 포함 — 인시던트 전에 막는 게 낫다 | Mechanical | P1 | API 직접 호출 시 가비지 저장 가능, 15줄 이하 수정 | defer |
| 3 | Design | hero CTA `rounded-md` → `rounded-sm` — DESIGN.md 버튼 규칙 | Mechanical | P5 | DESIGN.md: 버튼은 `--radius-sm` | rounded-md 유지 |
| 4 | Design | TODO-024 scope 확장 — line 117, notFound 버튼들도 포함 | Mechanical | P2 | 같은 파일/페이지, 동일 radius 위반, XS effort | defer |
| 5 | Eng | VALID_FIELD_CODES Option A — DTO 인라인 상수 | Mechanical | P5 | 단일 파일 변경, @repo/schema 패키지 변경 불필요 | Option B |
| 6 | Eng | 미니카드 button → Button 전환 제외 | Mechanical | P5 | 복잡한 flex 내부 레이아웃, 기능 변화 없는 refactor | 포함 |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/autoplan` Phase 1 | Strategy & scope | 1 | clean | TODO-026 삭제, SCHED-002 포함 확정 |
| Design Review | `/autoplan` Phase 2 | UI/UX gaps | 1 | clean | radius 위반 4개 추가 발견 (line 117, notFound 버튼) |
| Eng Review | `/autoplan` Phase 3 | Architecture & tests | 1 | clean | VALID_FIELD_CODES 타입 이슈, spec 업데이트 필요 |

**VERDICT:** APPROVED — CEO + Design + Eng 완료. 구현 시작 가능.
