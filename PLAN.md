<!-- /autoplan restore point: /c/Users/heo/.gstack/projects/jae-tech-bluecollar/main-autoplan-restore-20260416-122529.md -->

# Plan: 포트폴리오 모달 UX 스프린트

**Branch:** main
**Date:** 2026-04-16
**Status:** Implemented (post-hoc review)

---

## Problem Statement

포트폴리오 상세 모달이 단순 슬라이더 수준이었음. 워커가 시공 사진을 공간별로 분류해 업로드하지만 모달에서는 그냥 나열됐고, 시공 전/후 구분도 없었음. 데스크탑에서는 이미지와 정보가 세로로 길게 펼쳐져 스크롤해야 했음. 대시보드에서 "고객에게 어떻게 보이는지" 즉시 확인할 수 없었음.

---

## What Changed

### 핵심 컴포넌트 (`portfolio-detail-modal.tsx`)

- **데스크탑 2컬럼 레이아웃**: 왼쪽 이미지 패널(3fr) / 오른쪽 정보 패널(2fr) `md:grid-cols-[3fr_2fr]`
- **BeforeAfterTabs**: 시공 전/후 이미지를 탭으로 분리, 한쪽만 있으면 탭 없이 라벨만 표시
- **RoomTabGallery**: 공간별 사진을 수평 탭 + 캐러셀로 표시 (기존 썸네일 그리드 → 교체)
- **ImageCarousel**: 메인 이미지 + 화살표 네비게이션 + 썸네일 스트립 + 타입 배지
- **확장된 메타 정보**: spaceType, location, 면적(areaUnit), 시공 기간, 난이도, 비용, 태그, 보증, 시공 범위, 침실/욕실 수
- **빈 상태 처리**: 미디어 없음 / 내용 없음 모두 처리

### 대시보드 (`dashboard/page.tsx`)

- `selectedPortfolio` state + `PortfolioDetailModal` 렌더링 (mode="edit")
- 포트폴리오 카드에 hover 오버레이 + 클릭 핸들러
- Edit 모드에서 rooms 데이터 포함 로드 (`getPortfolioById` → 룸 상세 포함)

### 인증/네비게이션 버그 수정

- `navbar.tsx`: useLayoutEffect → useEffect 복귀 (SSR 경고 제거)
- `middleware.ts`: 토큰 판단 로직 개선 (Bearer 토큰 vs 쿠키 구분)
- 로그아웃 쿠키 삭제 버그 수정

### 백엔드 수정

- `update-portfolio.dto.ts`: `roomIndex` 필드 추가 (EditPortfolioMediaPayload)
- `portfolio.service.ts`: updatePortfolio에서 roomIndex→roomId 매핑 (createPortfolio와 동일 로직)

---

## Files Modified

- `apps/front/components/worker/portfolio-detail-modal.tsx` (+581/-261)
- `apps/front/app/dashboard/page.tsx` (+267/-267)
- `apps/front/components/dashboard/portfolio-form.tsx` (+377/-193)
- `apps/front/components/navbar.tsx` (+193/-127)
- `apps/api/src/domains/portfolio/services/portfolio.service.ts` (+28/-12)
- `apps/api/src/domains/portfolio/dtos/update-portfolio.dto.ts` (+12/-2)
- `apps/front/middleware.ts` (+10/-6)
- `apps/front/app/layout.tsx` (+13/-5)
- `apps/front/lib/profile-url.ts` (신규)

---

# /autoplan Phase 1: CEO Review

**Reviewed:** 2026-04-16 | **Mode:** SELECTIVE EXPANSION | **Branch:** main

---

## 0A. Premise Challenge

**Premise 1: "Modal changes affect both worker dashboard AND public client-facing profile"**
VALID. `worker/[slug]/page.tsx:429` imports and renders `PortfolioDetailModal`. Both modes are in production. Subagent finding (critical) was incorrect — corrected.

**Premise 2: "Room/before-after tab UX assumes workers categorize photos"**
CHALLENGED (high severity). Korean blue-collar workers likely dump flat phone photos without labeling. The RoomTabGallery only renders when `roomGroups.length > 0`. Need to verify: what % of portfolios have rooms with bound media? If under 30%, the tab system is dead code in production.

**Premise 3: "2-column desktop layout is correct for this modal size"**
VALID. `md:max-w-4xl` (896px) split 3fr:2fr gives ~537px image panel / ~357px info panel. Sufficient for both. Mobile falls through to single column.

**Premise 4: "mode="edit" preview is a valuable worker feedback loop"**
VALID. Workers need to see the client view without leaving the dashboard. The CTA swap (편집하기 vs 의뢰하기) is the right pattern.

**Premise challenged:** Room/before-after architecture presumes data quality that likely doesn't exist yet in production. See TODO below.

---

## 0B. Existing Code Leverage Map

| Sub-problem     | Existing code                                                                 |
| --------------- | ----------------------------------------------------------------------------- |
| Image display   | `next/image` fill pattern (consistent)                                        |
| Modal overlay   | `fixed inset-0 z-50` (matches other modals)                                   |
| Room data       | `PortfolioRoom` type from `@/lib/api` (id, roomType, roomLabel, displayOrder) |
| Media data      | `PublicProfileMedia` with roomId, imageType, displayOrder                     |
| Dashboard state | `useState` in `dashboard/page.tsx`                                            |
| Public profile  | `worker/[slug]/page.tsx` — same modal, mode="view"                            |

---

## 0C. Dream State Mapping

```
CURRENT STATE               THIS SPRINT                 12-MONTH IDEAL
────────────────────────    ─────────────────────────    ───────────────────────────────────
Single image slider         Before/after tabs           Lazy-loaded image lightbox
No room grouping            Room tabs + carousel        Room-level client comments
All info below images       2-col desktop layout        Shareable deep link per portfolio
No dashboard preview        mode="edit" preview         In-modal edit (no navigation)
Static animation inline     slideUp/fadeIn keyframes    Framer AnimatePresence
```

**Gap:** Modal is approaching full-page complexity (581 lines). 12-month push needs: (1) dedicated route, (2) deep link sharing, (3) content quality nudges (guided upload).

---

## 0C-bis. Implementation Alternatives

| Approach                      | Effort      | Risk                     | Decision                              |
| ----------------------------- | ----------- | ------------------------ | ------------------------------------- |
| Modal-first (current)         | Implemented | Med (complexity ceiling) | ACCEPTED for MVP                      |
| Route-first `/portfolio/[id]` | L           | Low                      | DEFER — needs sharing use case        |
| Guided upload wizard          | M           | Low                      | TODO — higher ROI than display polish |

---

## 0D. Expansion Candidates

| #   | Candidate                                   | Decision     | Destination         |
| --- | ------------------------------------------- | ------------ | ------------------- |
| 1   | Shareable `?portfolio=[id]` URL             | ADD to TODOS | TODO-052            |
| 2   | Keyboard arrow nav in carousel              | ADD to TODOS | TODO-053            |
| 3   | Touch swipe gesture on mobile               | ADD to TODOS | TODO-054            |
| 4   | Image zoom lightbox                         | DEFER        | Too complex now     |
| 5   | Worker profile link from modal              | ADD to TODOS | TODO-055            |
| 6   | Guided upload wizard ("add a before photo") | ADD to TODOS | TODO-056 (high ROI) |
| 7   | Room data quality check (% with room media) | ADD to TODOS | TODO-057            |

---

## Section 1: Problem-Solution Fit

Modal affects the client-facing conversion path AND the worker feedback loop. Both are valid surfaces. The before/after tabs are competitive with Houzz and 오늘의집. The room tab gallery is differentiated.

**Gap:** No analytics on modal-to-contact conversion. We can't measure if this work moved the needle. Landing analytics gap from the previous review (TODO-040) still applies here.

---

## Section 2: Error & Rescue Registry

| Error                                      | Trigger                  | Rescue                                    |
| ------------------------------------------ | ------------------------ | ----------------------------------------- |
| `rooms` array empty                        | Portfolio pre-roomId fix | Falls to roomlessMedia (correct)          |
| `media` array empty                        | No photos uploaded       | Empty state rendered (correct)            |
| `portfolio` is null                        | Parent passes null       | `if (!portfolio) return null` guard       |
| Image load failure (S3 URL broken/expired) | URL invalid              | No `onError` handler — shows broken image |
| `activeIdx` out of range                   | groups.length changes    | `groups[activeIdx]` with optional access  |

**Gap:** No `onError` on `<Image>` components. Risk becomes real when S3 URLs expire.

---

## Section 3: Failure Modes Registry

| Failure Mode                        | Probability        | Impact                 | Mitigation                  |
| ----------------------------------- | ------------------ | ---------------------- | --------------------------- |
| Room data empty → tabs never render | High (early stage) | Feature appears absent | Check DB, add content nudge |
| Image load broken (S3 URL)          | Med                | Visual corruption      | Add `onError` fallback      |
| 581-line component → split needed   | Low now, Med (6mo) | Maintainability        | Plan route migration        |
| `priority` on dynamic image         | Low                | Performance regression | Fix: only on idx===0        |
| Inline keyframes → style injection  | Low                | React perf regression  | Move to globals.css         |

---

## Section 4: Scope Calibration

10 commits for a modal UX sprint: appropriate. Feature grew from "add preview mode" to "full redesign" — justified given the roomId fix making room data actually useful. 581-line boundary is near the ceiling. Next feature = extract to route.

---

## Section 5: Competitive Landscape

- **Houzz**: Before/after tabs ✓, Room-based gallery ✓
- **오늘의집**: "방별 사진" gallery ✓ — this implementation mirrors it directly
- **Behance**: Full-page. BlueCollar correctly stays at modal for MVP.
- **당근마켓**: No structured portfolio. The room/before-after UX is a real differentiator IF workers populate it.

---

## Section 6: Observability

No analytics on modal opens, tab switches, room selections, or CTA clicks. This is the same gap from the previous review. For this sprint specifically, we can't measure:

- What % of public profile views open a portfolio modal
- What % result in a phone call
- Which room tabs are viewed most

---

## Section 7: Security

Modal is read-only. No security concerns. Auth/middleware fixes in this sprint were already scoped correctly.

---

## Section 8: Data Model

`PublicProfilePortfolio` returns `rooms[]` and `media[]` correctly. Modal filters `media.filter(m => m.roomId === room.id)` — correct. The `roomlessMedia` fallback correctly handles pre-fix portfolios.

---

## Section 9: Performance

3 performance issues found:

1. **Missing `sizes` on carousel images** — `fill` without `sizes` causes browser to download full-viewport-width images. Should be `sizes="(max-width: 768px) 100vw, 540px"`.
2. **Inline `<style>` keyframes** (line 621-624) — injected on every component mount. Move to `globals.css`.
3. **`priority` on dynamic idx image** — `priority` is a static LCP hint, not a dynamic flag. Should only be on idx===0.

---

## Section 10: Test Coverage

| Flow                                       | Test? |
| ------------------------------------------ | ----- |
| Modal renders with full portfolio          | NO    |
| `BeforeAfterTabs` defaults to "after"      | NO    |
| `RoomTabGallery` tab label rendering       | NO    |
| `ImageCarousel` prev/next bounds           | NO    |
| mode="edit" CTA swap                       | NO    |
| `updatePortfolio` roomIndex→roomId mapping | NO    |

Coverage: 0%. The `updatePortfolio` roomIndex fix (4f80c0d) is the highest-risk untested path.

---

## What Already Exists

| Sub-problem       | Existing code                                      |
| ----------------- | -------------------------------------------------- |
| Portfolio display | `worker/[slug]/page.tsx` — same modal, public view |
| Auth guard        | JwtAuthGuard — not relevant to modal               |
| S3 media storage  | Pre-existing — modal just reads URLs               |
| Dashboard state   | Existing `useState` pattern                        |

---

## NOT in Scope (deferred)

| Item                           | Reason                     | Destination |
| ------------------------------ | -------------------------- | ----------- |
| Shareable portfolio URL        | Design decision needed     | TODO-052    |
| Keyboard carousel nav          | Accessibility improvement  | TODO-053    |
| Touch swipe                    | Mobile UX improvement      | TODO-054    |
| Image zoom lightbox            | Too complex for now        | —           |
| Worker profile link from modal | Quick win                  | TODO-055    |
| Guided upload wizard           | Content quality bottleneck | TODO-056    |
| DB room data quality check     | Validate UX assumptions    | TODO-057    |

---

## Dream State Delta

- DONE: Visual modal is competitive with Houzz/오늘의집
- DONE: Worker feedback loop (preview mode)
- MISSING: Content quality nudges, analytics, deep link sharing, image error handling

---

## CEO Completion Summary

| Dimension               | Assessment                                                                  |
| ----------------------- | --------------------------------------------------------------------------- |
| Problem-solution fit    | Modal affects both worker AND client paths — correct scope                  |
| Scope calibration       | 10 commits appropriate; 581-line component near ceiling                     |
| Competitive positioning | Room tab + before/after tabs: differentiated vs 당근마켓                    |
| Technical risk          | Low (display only)                                                          |
| Critical gap            | Room data likely empty in prod → tabs never render (validate with TODO-057) |
| Deferred items          | 7 items → TODOS.md                                                          |
| Mode                    | SELECTIVE EXPANSION                                                         |

---

## CEO Dual Voices

### CODEX SAYS (CEO — strategy): `[unavailable — OpenAI 401]`

### CLAUDE SUBAGENT (CEO — strategic independence)

5 findings (corrected for modal being on public profile page):

1. **Wrong problem framing — corrected** (Modal IS on public profile. Downgrade to Medium) — sprint does affect client conversion path. BUT: no analytics means we can't measure impact.
2. **Assumed premise: workers categorize photos** (High) — room/before-after UX assumes data that likely doesn't exist. Check DB before more display work.
3. **6-month regret: display complexity before content quality** (High) — 581-line modal for sparse content. Guided upload wizard has higher ROI.
4. **Dismissed alternative: guided upload** (High) — never evaluated. Should be next sprint.
5. **Competitive risk: 당근마켓 Pro tier** (Medium) — moat is trade license verification, not better photo display.

```
CEO DUAL VOICES — CONSENSUS TABLE: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   PARTLY  N/A    [subagent-only]
  2. Right problem to solve?           PARTLY  N/A    [subagent-only]
  3. Scope calibration correct?        NO      N/A    [subagent-only]
  4. Alternatives sufficiently explored? NO    N/A    [subagent-only]
  5. Competitive/market risks covered? NO      N/A    [subagent-only]
  6. 6-month trajectory sound?         PARTLY  N/A    [subagent-only]
═══════════════════════════════════════════════════════════════
[subagent-only] = Codex unavailable.
```

**Phase 1 COMPLETE.** Subagent: 5 issues (1 corrected). Codex: unavailable.
Consensus: 0/6 confirmed (single-model mode).
Passing to Phase 2 (Design Review — UI scope detected).

---

<!-- /autoplan review started: 2026-04-16 -->

## Decision Audit Trail

| #   | Phase | Decision                                             | Classification | Principle         | Rationale                                        | Rejected    |
| --- | ----- | ---------------------------------------------------- | -------------- | ----------------- | ------------------------------------------------ | ----------- |
| 1   | CEO   | Mode: SELECTIVE EXPANSION                            | Mechanical     | P3 (pragmatic)    | Post-hoc review, scope clear                     | —           |
| 2   | CEO   | Candidate 1 (shareable URL): ADD to TODO-052         | Mechanical     | P1 (completeness) | S effort, sharing use case                       | —           |
| 3   | CEO   | Candidate 2 (keyboard nav): ADD to TODO-053          | Mechanical     | P1 (completeness) | XS effort, accessibility                         | —           |
| 4   | CEO   | Candidate 3 (touch swipe): ADD to TODO-054           | Mechanical     | P1 (completeness) | S effort, mobile UX                              | —           |
| 5   | CEO   | Candidate 4 (image zoom): DEFER                      | Mechanical     | P3 (pragmatic)    | M effort, out of scope now                       | Inline      |
| 6   | CEO   | Candidate 5 (profile link): ADD to TODO-055          | Mechanical     | P5 (explicit)     | XS effort, UX clarity                            | —           |
| 7   | CEO   | Candidate 6 (guided upload): ADD to TODO-056         | Mechanical     | P1 (completeness) | High ROI, content quality                        | Modal-first |
| 8   | CEO   | Candidate 7 (DB room quality check): ADD to TODO-057 | Mechanical     | P5 (explicit)     | Validate UX assumptions before more display work | —           |

---

# /autoplan Phase 2: Design Review

**Reviewed:** 2026-04-16 | **Branch:** main | **DESIGN.md:** Present

---

## Step 0: Design Scope Assessment

**Rating: 6/10** — Component is visually considered but has 2 critical DESIGN.md violations (tracking-wider on Korean text, ad-hoc badge color), one broken desktop empty state, and several UX ambiguities.

**DESIGN.md:** Present. All findings calibrated against it.

---

## Design Dual Voices

### CODEX SAYS (Design — UX challenge): `[unavailable — OpenAI 401]`

### CLAUDE SUBAGENT (Design — independent review)

12 findings:

**Critical:**

- `tracking-wider` on Korean text (lines 213, 222, 243, 395, 484, 641) — DESIGN.md explicitly bans letter-spacing on Korean. Every section label and tab button has it. Fix: remove `tracking-wider` from Korean-containing elements.
- `bg-primary/8` tag badges (line 469) — not a DESIGN.md color token. Will break in dark mode. Fix: use `bg-accent text-accent-foreground` or neutral.

**High:**

- Close button `rounded-full` (line 359) — DESIGN.md assigns buttons to `--radius-sm`. Fix: `rounded-md` at most.
- Desktop left panel: empty state has `md:hidden` (line 404) — blank white void on desktop when no photos. Fix: remove `md:hidden`.
- Disabled CTA button: no explanation why disabled (lines 606–612). Fix: add inline label "전화번호 미등록".
- `constructionScopeLabel` outputs raw English title-case inside Korean UI (line 492). Fix: Korean lookup map like `ROOM_TYPE_LABELS`.

**Medium:**

- `formatCost` merges estimatedCost + actualCost as a range display (lines 326–333). Semantically wrong — they're quote vs actual, not a range. Fix: label separately.
- Date format missing space before `~` separator (line 439).
- No loading state pattern defined.
- `BeforeAfterTabs` "after" tab underline uses `bg-primary` (orange), "before" uses `bg-foreground` (black) — asymmetry implies "after = primary" (fine, but undocumented).

**Low:**

- Inline `<style>` keyframes injected on every render (lines 621–624). Fix: move to globals.css.
- `aria-label={title}` on dialog wrapper instead of `aria-labelledby` pointing to `<h2>` (line 342). Fix: add id to h2, use aria-labelledby.

```
DESIGN LITMUS SCORECARD: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Information hierarchy correct?    MOSTLY  N/A    [subagent-only]
  2. Empty states specified?           PARTIAL N/A    [subagent-only]
  3. Design system compliance?         NO      N/A    [subagent-only]
  4. Responsive behavior intentional?  MOSTLY  N/A    [subagent-only]
  5. Accessibility specified?          PARTIAL N/A    [subagent-only]
  6. User journey complete?            MOSTLY  N/A    [subagent-only]
  7. AI slop risk?                     LOW     N/A    [subagent-only]
═══════════════════════════════════════════════════════════════
```

---

## Design Passes 1–7

**Pass 1 — Information Hierarchy: 8/10**
User sees: title → meta badges → tags (right panel) while images load on left. Correct reading order. Cost badge (`bg-accent`) has appropriate visual weight. Critical gap: `constructionScopeLabel` outputs English ("Full Renovation") inside Korean UI — breaks reading flow.

**Pass 2 — Missing States: 5/10**

- Empty media + no content: handled with text message ✓
- Desktop left panel with no photos: blank void (md:hidden on empty state) ✗
- Image load error: no `onError` handler ✗
- No loading skeleton (acceptable for now, risky when async) ✗
- Disabled CTA with no explanation ✗

**Pass 3 — User Journey: 7/10**
| Stage | Component | Emotion target | Status |
|-------|-----------|---------------|--------|
| Open modal | slideUp animation | "This feels premium" | PASS |
| Browse photos | Carousel + tabs | "I can see the work" | PASS (if data exists) |
| Check info | Right panel badges | "I understand the scope" | PARTIAL — English scope label breaks it |
| Contact | CTA at bottom | "I'll call now" | FAIL — disabled with no explanation |

**Pass 4 — Design System Compliance: 4/10**
| Issue | Location | Severity | Fix |
|-------|----------|---------|-----|
| `tracking-wider` on Korean | lines 213, 222, 243, 395, 484, 641 | Critical | Remove |
| `bg-primary/8` badge | line 469 | Critical | Use `bg-accent` |
| `rounded-full` close button | line 359 | High | `rounded-md` |
| `bg-foreground/60` type badge | lines 123, 146 | Medium | DESIGN.md neutral token |

**Pass 5 — Responsive Behavior: 7/10**

- Mobile: single column scroll — correct
- Desktop: 2-col `md:grid-cols-[3fr_2fr]` — correct
- `max-h-[96dvh] md:max-h-[90dvh]` — correct use of dvh
- Gap: left panel can be empty (no photos) on desktop with no visual affordance

**Pass 6 — Accessibility: 5/10**

- Escape key handler ✓
- `role="dialog" aria-modal="true"` ✓
- `aria-label={title}` on dialog — should be `aria-labelledby` pointing to h2 ✗
- Carousel prev/next have `aria-label` ✓
- Tab buttons have no `aria-selected` ✗
- No focus trap in modal ✗ (keyboard users can tab outside)
- Disabled CTA: `cursor-not-allowed` but no `aria-disabled` ✗

**Pass 7 — AI Slop Risk: 8/10**
Not slop. The 2-column layout is considered. The BeforeAfterTabs is the right UX for renovation photos. The RoomTabGallery mirrors 오늘의집 "방별 사진" intentionally. The tracking-wider issue is a repeat of the previous sprint's Korean text problem — same violation pattern.

---

## Design Phase Issues → TODOS

| ID     | File                         | Line                         | Issue                                                | Severity | Fix                                                 |
| ------ | ---------------------------- | ---------------------------- | ---------------------------------------------------- | -------- | --------------------------------------------------- |
| D2-001 | `portfolio-detail-modal.tsx` | 213, 222, 243, 395, 484, 641 | `tracking-wider` on Korean labels                    | Critical | Remove `tracking-wider`                             |
| D2-002 | `portfolio-detail-modal.tsx` | 469                          | `bg-primary/8` tag badge — not a token               | Critical | `bg-accent text-accent-foreground border-accent/40` |
| D2-003 | `portfolio-detail-modal.tsx` | 359                          | Close button `rounded-full` → should be `rounded-md` | High     | `rounded-md`                                        |
| D2-004 | `portfolio-detail-modal.tsx` | 403–410                      | Desktop left panel empty state: `md:hidden`          | High     | Remove `md:hidden`                                  |
| D2-005 | `portfolio-detail-modal.tsx` | 606–612                      | Disabled CTA no explanation                          | High     | Add "전화번호 미등록" label                         |
| D2-006 | `portfolio-detail-modal.tsx` | 86–93                        | `constructionScopeLabel` outputs English             | High     | Korean lookup map                                   |
| D2-007 | `portfolio-detail-modal.tsx` | 326–333                      | est/actual cost displayed as range                   | Medium   | Label separately                                    |
| D2-008 | `portfolio-detail-modal.tsx` | 439                          | Missing space before `~` in date range               | Medium   | Fix string interpolation                            |
| D2-009 | `portfolio-detail-modal.tsx` | 621–624                      | Inline `<style>` keyframes                           | Low      | Move to globals.css                                 |
| D2-010 | `portfolio-detail-modal.tsx` | 342                          | `aria-label` → should be `aria-labelledby`           | Low      | id on h2, aria-labelledby on dialog                 |
| D2-011 | `portfolio-detail-modal.tsx` | 208–228                      | Tab buttons missing `aria-selected`                  | Low      | Add `aria-selected={i === activeIdx}`               |
| D2-012 | `portfolio-detail-modal.tsx` | 338                          | No focus trap in modal                               | Low      | Add focus trap (tabindex, focus management)         |

---

**Phase 2 COMPLETE.**
Design: 6/10 → after fixes → 8.5/10 projected.
Critical: 2 (tracking-wider, bad badge token). High: 4. Medium: 2. Low: 4.
Dual voices: [subagent-only] (Codex unavailable).

Phase-transition summary:

> **Phase 2 complete.** Claude subagent: 12 issues (2 critical, 4 high, 4 medium, 2 low). Codex: unavailable. Consensus: [subagent-only]. Passing to Phase 3 (Eng Review).

---

## Decision Audit Trail (Design additions)

| #   | Phase  | Decision                                       | Classification | Principle         | Rationale                                           | Rejected |
| --- | ------ | ---------------------------------------------- | -------------- | ----------------- | --------------------------------------------------- | -------- |
| 9   | Design | D2-001 tracking-wider Korean: ADD to TODOS     | Mechanical     | P1 (completeness) | Same violation as previous sprint — repeat offender | —        |
| 10  | Design | D2-002 bg-primary/8 badge: ADD to TODOS        | Mechanical     | P5 (explicit)     | Not a DESIGN.md token, dark mode will break         | —        |
| 11  | Design | D2-003 close button rounded-full: ADD to TODOS | Mechanical     | P5 (explicit)     | DESIGN.md radius hierarchy violation                | —        |
| 12  | Design | D2-004 desktop empty state: ADD to TODOS       | Mechanical     | P1 (completeness) | UX void on desktop — visible regression             | —        |
| 13  | Design | D2-005 disabled CTA explanation: ADD to TODOS  | Mechanical     | P1 (completeness) | User confusion — no feedback on disabled            | —        |
| 14  | Design | D2-006 constructionScope Korean: ADD to TODOS  | Mechanical     | P5 (explicit)     | English in Korean UI — localization gap             | —        |
| 15  | Design | D2-007/008 cost+date: ADD to TODOS (medium)    | Mechanical     | P3 (pragmatic)    | Semantic correctness, low effort                    | —        |
| 16  | Design | D2-009/010/011/012: ADD to TODOS (low)         | Mechanical     | P3 (pragmatic)    | Accessibility + perf improvements                   | —        |

---

# /autoplan Phase 3: Eng Review

**Reviewed:** 2026-04-16 | **Branch:** main

---

## Architecture Snapshot

```
┌──────────────────────────────────────────────────────────────────────┐
│              PORTFOLIO MODAL SPRINT — DEPENDENCY MAP                  │
│                                                                       │
│  [Browser / Public Profile]                                           │
│     worker/[slug]/page.tsx                                            │
│        └── <PortfolioDetailModal mode="view" portfolio={p}>          │
│                                                                       │
│  [Browser / Dashboard]                                                │
│     app/dashboard/page.tsx                                            │
│        ├── <PortfolioCard> onClick → setSelectedPortfolio(p)         │
│        └── <PortfolioDetailModal mode="edit" portfolio={p}>          │
│               onEdit → router.push(`/dashboard/portfolio/${id}/edit`)│
│                                                                       │
│  portfolio-detail-modal.tsx (581 lines)                               │
│     ├── ImageCarousel (images[])                                      │
│     ├── BeforeAfterTabs → ImageCarousel x2                            │
│     └── RoomTabGallery → ImageCarousel (key={room.id})               │
│                                                                       │
│  [NestJS — port 4000]                                                 │
│     PATCH /portfolios/:id → portfolio.service.ts:updatePortfolio     │
│        ├── Step 6: DELETE portfolioRooms + INSERT new                 │
│        │   (FK onDelete: "set null" → media.roomId set null)         │
│        ├── Step 7: PATCH portfolioTags                                │
│        └── Step 8: DELETE portfolioMedia + INSERT new                 │
│               (roomIndex → insertedRooms[i].id mapping)              │
│                                                                       │
│  [Schema] portfolioMedia.roomId FK → portfolioRooms.id               │
│     onDelete: "set null" ← SAFE, no FK violation during update       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Test Coverage Diagram

```
CODE PATH COVERAGE
══════════════════════════════════════════════════════════════════════════
  Path                                                Covered?  Notes
  ─────────────────────────────────────────────────── ────────  ───────────
  PortfolioDetailModal: full portfolio render         NO        No spec
  PortfolioDetailModal: media=[], rooms=[], content=null NO     Empty state branch
  BeforeAfterTabs: defaults to "after" when both exist NO      Behavioral
  BeforeAfterTabs: only before / only after           NO        Single tab path
  RoomTabGallery: tab switch resets carousel (key=)   NO        key= trick
  ImageCarousel: prev/next bounds disable             NO        Behavioral
  ImageCarousel: priority only on first image         NO        Performance
  mode="edit" CTA shows 편집하기                       NO        CTA swap
  tel: phone href rendered from stored data           NO        Security path
  updatePortfolio: rooms=[] + media[roomIndex:0]      NO        P1 bug path
  updatePortfolio: roomIndex out of bounds            NO        Silent data loss
  updatePortfolio: transaction rollback on failure    NO        Correctness
  formatCost(0): zero-cost portfolio                  NO        Edge case
══════════════════════════════════════════════════════════════════════════

USER FLOW COVERAGE
══════════════════════════════════════════════════════════════════════════
  Flow                                         E2E?  Unit?  Notes
  ──────────────────────────────────────────── ───── ─────  ─────────────
  Worker edits portfolio, saves with rooms     NO    NO     roomIndex fix
  Worker previews portfolio from dashboard     NO    NO     mode="edit"
  Client views portfolio modal (public)        NO    NO     mode="view"
  Client clicks "의뢰하기" (phone CTA)          NO    NO     tel: href
══════════════════════════════════════════════════════════════════════════
Coverage: 0% on all new paths.
```

---

## Eng Dual Voices

### CODEX SAYS (Eng — architecture challenge): `[unavailable — OpenAI 401]`

### CLAUDE SUBAGENT (Eng — independent review)

10 findings, organized by severity:

**Critical:**

- `tel:${phone}` href injection (line 598) — `phone` comes from worker-stored profile data. If stored value is malformed or crafted (e.g., injected during onboarding), `href` is unsafe. Fix: validate phone matches `/^\+?[\d\s\-()+]+$/` before rendering.

**High:**

- `roomIndex` out-of-bounds silently drops roomId (service.ts:520) — if client sends stale roomIndex after concurrent room delete, media attaches to "roomless" bucket with no error. Add `BadRequestException` guard.
- FK ordering concern (CORRECTED) — `onDelete: "set null"` means room delete cascades safely. Not a real issue. Schema handles it.

**Medium:**

- `formatCost(0)` returns null for zero-cost (line 46) — `if (!amount)` is falsy for 0. Fix: `if (amount == null)`.
- Body overflow lock not stacked (line 262) — double-mount (fast nav) resets overflow for both. Fix: class-based counter.
- `priority` on every carousel image (line 119) — multiple high-priority preloads. Fix: `priority` prop, pass only to topmost carousel.
- `media` not null-guarded at destructuring (line 294) — partial API response could crash. Fix: `portfolio.media ?? []`.

**Low:**

- `RoomTabGallery` declared after usage (module order antipattern).
- Missing `useMemo` on `roomGroups` / `roomlessMedia` computed values (O(n\*m) per render).
- Date parsing fragile for ISO timestamps — use `Intl.DateTimeFormat`.

```
ENG DUAL VOICES — CONSENSUS TABLE: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                              Claude  Codex  Consensus
  ─────────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?                  MOSTLY  N/A    [subagent-only]
  2. Data integrity safe?                 MOSTLY  N/A    roomIndex OOB gap
  3. Security surface OK?                 NO      N/A    tel: href risk
  4. Test coverage adequate?              NO      N/A    0% coverage
  5. Error paths handled?                 PARTIAL N/A    formatCost(0)
  6. Performance acceptable?              PARTIAL N/A    priority + useMemo
═══════════════════════════════════════════════════════════════
[subagent-only] = Codex unavailable.
```

---

## Eng Findings Summary

| ID     | Finding                                 | Severity | File                             | Fix                              | Est.  |
| ------ | --------------------------------------- | -------- | -------------------------------- | -------------------------------- | ----- |
| E2-001 | `tel:${phone}` unsanitized href         | Critical | `portfolio-detail-modal.tsx:598` | Validate phone regex before href | 30min |
| E2-002 | `roomIndex` OOB silent data loss        | High     | `portfolio.service.ts:520`       | BadRequestException guard        | 30min |
| E2-003 | `formatCost(0)` drops zero-cost         | Medium   | `portfolio-detail-modal.tsx:46`  | `if (amount == null)`            | 5min  |
| E2-004 | Body lock not stacked                   | Medium   | `portfolio-detail-modal.tsx:262` | Class-based counter              | 20min |
| E2-005 | `priority` on all carousel images       | Medium   | `portfolio-detail-modal.tsx:119` | Pass as prop, only topmost       | 20min |
| E2-006 | `media` not null-guarded at destructure | Medium   | `portfolio-detail-modal.tsx:294` | `portfolio.media ?? []`          | 5min  |
| E2-007 | `RoomTabGallery` declared after usage   | Low      | `portfolio-detail-modal.tsx:630` | Move above consumers             | 15min |
| E2-008 | Missing `useMemo` on roomGroups         | Low      | `portfolio-detail-modal.tsx:297` | `useMemo([media, rooms])`        | 20min |
| E2-009 | Date parsing fragile for ISO timestamps | Low      | `portfolio-detail-modal.tsx:436` | `Intl.DateTimeFormat`            | 15min |

---

## NOT in Scope (Eng Phase)

| Item                               | Reason                     |
| ---------------------------------- | -------------------------- |
| Design token fixes (D2-001–D2-012) | Design phase               |
| Full E2E test suite setup          | Separate infra work        |
| Loading skeleton                   | Pre-existing gap           |
| Focus trap                         | Accessibility sprint scope |

---

## What Already Exists

| Problem area             | Existing code                                            |
| ------------------------ | -------------------------------------------------------- |
| Phone validation pattern | None in frontend — needs to be added                     |
| Transaction rollback     | Drizzle tx wraps all steps — rollback automatic on throw |
| Modal overlay pattern    | Same `fixed inset-0` used in other modals                |
| Empty state patterns     | `dashboard/page.tsx` has similar patterns                |

---

## Failure Modes Registry (Eng additions)

| Failure Mode                          | Probability                    | Impact                | Mitigation                 |
| ------------------------------------- | ------------------------------ | --------------------- | -------------------------- |
| `tel:` href injection                 | Low (requires bad stored data) | XSS/phishing vector   | E2-001 regex validation    |
| `roomIndex` OOB after concurrent edit | Low                            | Silent room data loss | E2-002 server guard        |
| `formatCost(0)` drops zero            | Low                            | Missing display info  | E2-003 null check          |
| Double-mount body lock                | Low (fast nav)                 | Broken scroll         | E2-004 class counter       |
| Multiple `priority` images            | Med                            | LCP perf regression   | E2-005 prop-based priority |

---

## Eng Completion Summary

| Dimension      | Assessment                                                       |
| -------------- | ---------------------------------------------------------------- |
| Architecture   | Sound layering; 581-line modal near extraction threshold         |
| Data integrity | roomIndex OOB is a gap; FK ordering is safe (onDelete: set null) |
| Security       | `tel:` href injection risk — fix before public launch            |
| Test coverage  | 0% on all new paths — critical fix path untested                 |
| Performance    | `priority` on all carousels + missing `useMemo`                  |
| Quick wins     | E2-003 (5min), E2-006 (5min), E2-009 (15min)                     |

**Phase 3 COMPLETE.**

Phase-transition summary:

> **Phase 3 complete.** Claude subagent: 9 issues (1 critical, 2 high, 4 medium, 2 low). FK ordering risk: false positive (onDelete: set null). Codex: unavailable. Consensus: [subagent-only]. No DX scope detected — skipping Phase 3.5. Proceeding to Phase 4 (Final Gate).

---

## Decision Audit Trail (Eng additions)

| #   | Phase | Decision                                       | Classification | Principle         | Rationale                             | Rejected        |
| --- | ----- | ---------------------------------------------- | -------------- | ----------------- | ------------------------------------- | --------------- |
| 17  | Eng   | E2-001 tel: href: ADD to TODOS (critical)      | Mechanical     | P1 (completeness) | Security boundary — fix before launch | —               |
| 18  | Eng   | E2-002 roomIndex OOB: ADD to TODOS             | Mechanical     | P1 (completeness) | Silent data loss on edge case         | —               |
| 19  | Eng   | E2-003 formatCost(0): ADD to TODOS (quick win) | Mechanical     | P3 (pragmatic)    | 5-min fix                             | —               |
| 20  | Eng   | E2-004 body lock: ADD to TODOS                 | Mechanical     | P3 (pragmatic)    | Low probability, medium impact        | —               |
| 21  | Eng   | E2-005/006 priority+null: ADD to TODOS         | Mechanical     | P1 (completeness) | Performance + correctness             | —               |
| 22  | Eng   | E2-007/008/009: ADD to TODOS (low)             | Mechanical     | P3 (pragmatic)    | Low risk, easy fixes                  | —               |
| 23  | Eng   | FK ordering concern: NOT A BUG                 | Mechanical     | P5 (explicit)     | Schema has onDelete: set null — safe  | Flagged as high |

---

## GSTACK REVIEW REPORT

| Review        | Trigger             | Why                       | Runs | Status      | Findings                                           |
| ------------- | ------------------- | ------------------------- | ---- | ----------- | -------------------------------------------------- |
| CEO Review    | `/autoplan` Phase 1 | Scope & strategy          | 1    | issues_open | 7 deferred, room data quality unchecked            |
| Eng Review    | `/autoplan` Phase 3 | Architecture & tests      | 1    | issues_open | 1 critical (tel: href), 9 total                    |
| Design Review | `/autoplan` Phase 2 | UI/UX gaps                | 1    | issues_open | 2 critical (tracking-wider, badge token), 12 total |
| DX Review     | n/a                 | No developer-facing scope | 0    | skipped     | —                                                  |
| Codex Review  | attempted           | Independent 2nd opinion   | 0    | unavailable | OpenAI 401 (API key issue)                         |

**VERDICT:** APPROVED WITH P0 FIXES — 5 issues fixed this session (E2-001 tel: security, E2-003 formatCost, E2-006 null guard, D2-001 tracking-wider, D2-002 badge token). 17 items tracked in TODOS.md (TODO-063 to TODO-079). Build passing. `/ship` when ready.

---

# Plan: 랜딩 페이지 전면 리디자인

**Branch:** main
**Date:** 2026-04-08
**Status:** Implemented (post-hoc review)

---

## Problem Statement

기존 랜딩 페이지가 2019년식 SaaS 패턴(Hero 2-col + feature grid + full-width dark CTA banner)이어서 올드하게 느껴짐. 블루칼라 기술자 포트폴리오 서비스에 맞는 현대적이고 임팩트 있는 랜딩이 필요.

---

## What Changed

### 컴포넌트 구조 변경

- `DiscoveryGallery` → 제거
- `PortfolioStrip` → 신규 (자동 스크롤 마퀴 방식)
- `HowItWorks` → 신규 (3-step numbered timeline)
- `HeroSection` → 전면 재작성
- `ClientCTA` → 재작성 (full-width banner → inset rounded card)
- `Footer` → 수정 (더미 데이터 제거, 준비 중 링크 비활성화)
- `Navbar` → 수정 (프로젝트 탐색 추가, 유저 메뉴 개선, 모바일 메뉴 수정)

### 페이지 순서

1. `Navbar`
2. `HeroSection` — full viewport, 큰 헤드라인, 워커 미니카드
3. `PortfolioStrip` — 자동 스크롤 마퀴 (8개 시공 프로젝트 카드)
4. `HowItWorks` — 가입→사진업로드→링크공유 3단계
5. `ClientCTA` — `max-w-4xl` inset dark card
6. `Footer`

### CSS 추가

- `globals.css`: `@keyframes marquee` + `.animate-marquee` 클래스
- `prefers-reduced-motion: no-preference` 조건부 적용

---

## Key Decisions

1. **자동 스크롤 마퀴**: 발견성 문제 해결 (사용자가 아무것도 안 해도 시공 사진이 흐름)
2. **카드 2배 복제**: `[...items, ...items]`로 seamless infinite loop
3. **호버 정지**: `.animate-marquee:hover { animation-play-state: paused }`
4. **접근성**: 복제 카드 `tabIndex=-1 aria-hidden`, `prefers-reduced-motion` 대응
5. **slug 포맷**: `slug.bluecollar.cv` (서브도메인 방식, bluecollar.cv/slug 아님)

---

## Files Modified

- `apps/front/app/page.tsx`
- `apps/front/app/globals.css`
- `apps/front/components/hero-section.tsx`
- `apps/front/components/portfolio-strip.tsx` (신규)
- `apps/front/components/how-it-works.tsx` (신규)
- `apps/front/components/client-cta.tsx`
- `apps/front/components/footer.tsx`
- `apps/front/components/navbar.tsx`

---

## Build Status

✓ `pnpm build` 통과 (4 tasks successful)

---

# /autoplan Phase 2: Design Review

**Reviewed:** 2026-04-13 | **Branch:** main | **DESIGN.md:** Present

## Step 0: Design Scope Assessment

**Rating: 5/10** — The plan describes which components were built but specifies zero design decisions for: edge cases, empty states, responsive breakpoints beyond "marquee runs on all sizes," and accessibility compliance.

**DESIGN.md:** Present and detailed. All findings calibrated against it.

**Existing design leverage:** DESIGN.md token system (radius, color, spacing) is defined. Components use Tailwind CSS vars (`text-primary`, `bg-secondary`, `border-border`). Some violations found (see below).

---

## Design Dual Voices

### CODEX SAYS (Design — UX challenge): `[unavailable — OpenAI 401]`

### CLAUDE SUBAGENT (Design — independent review)

7 findings:

**Critical:**

- `tracking-tight` on Korean headings (`hero-section.tsx:23`, `how-it-works.tsx:27`) — DESIGN.md explicitly bans letter-spacing on Korean text. Remove `tracking-tight` from all Korean headings.

**High:**

- `text-primary-foreground/50` and `/40` in `client-cta.tsx:22,36` — arbitrary opacity on white against dark bg fails WCAG AA (~2.5:1 contrast). Replace with `text-primary-foreground/70` minimum.
- `max-w-4xl` in `client-cta.tsx:13` overshoots DESIGN.md's 768px max. Change to `max-w-2xl` or `max-w-3xl`.
- Portfolio strip category badge uses `bg-foreground/60` — not a defined token. Will break in dark mode.

**Medium:**

- `rounded` badge in `hero-section.tsx:18` and `how-it-works.tsx:49` — should be `rounded-sm` (DESIGN.md `--radius-sm: 6px`).
- Worker mini-cards in HeroSection open signup modal instead of worker profile. UX decision buried silently in code.
- `primary/10` badge background ≠ `#FFF3E8` accent — diverges in dark mode.

```
DESIGN LITMUS SCORECARD: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Information hierarchy correct?    MOSTLY  N/A    [subagent-only]
  2. Empty states specified?           NO      N/A    [subagent-only]
  3. Design system compliance?         NO      N/A    [subagent-only]
  4. Responsive behavior intentional?  PARTIAL N/A    [subagent-only]
  5. Accessibility specified?          PARTIAL N/A    [subagent-only]
  6. User journey complete?            PARTIAL N/A    [subagent-only]
  7. AI slop risk?                     LOW     N/A    [subagent-only]
═══════════════════════════════════════════════════════════════
```

---

## Design Passes 1-7

**Pass 1 — Information Hierarchy: 7/10**
Sequence: badge → headline → subtext → CTA → worker mini-cards → marquee → how-it-works → client CTA.
This is correct for worker acquisition. Gap: the marquee has no introductory framing — "최근 등록된 시공" label floats without product context for first-time visitors.

**Pass 2 — Missing States: 3/10**

- `HeroSection`: WORKERS array from `@/lib/data` — hardcoded. If it ever comes from API, zero loading/empty state handling.
- `PortfolioStrip`: PROJECTS static. If `items` is empty, `animate-marquee` div is invisible — no fallback, no empty state.
- `ClientCTA`: "프로젝트 의뢰하기" button has no disabled/loading state after click. Double-submit risk.
- All: no skeleton loading. Not critical now (static data), but will become critical when real data flows.

**Pass 3 — User Journey: 6/10**
| Stage | Component | Emotion target | Status |
|-------|-----------|---------------|--------|
| Arrive | hero | "This is for me" | PASS |
| Curiosity | portfolio-strip | "Real work" | FAIL — static mock images undermine trust |
| Understanding | how-it-works | "I can do this in 3 min" | PASS — step badges too weak visually |
| Conversion | client-cta | "I'll try it now" | PARTIAL — dark block looks like footer, not CTA |

No testimonial, no user count, no risk-reversal copy before second conversion ask.

**Pass 4 — Design System Compliance: 4/10**

- `tracking-tight` on Korean h1/h2 → CRITICAL. Violates explicit DESIGN.md rule.
- `max-w-4xl` (896px) in client-cta > DESIGN.md max 768px → HIGH.
- `rounded` (4px) used on badges instead of `rounded-sm` (6px) → MEDIUM.
- `bg-foreground/60` badge in portfolio-strip is an undefined token → MEDIUM.
- `primary/10` ≠ accent `#FFF3E8` in dark mode → MEDIUM.
- `text-primary-foreground/50` fails WCAG AA → HIGH.

**Pass 5 — Responsive Behavior: 6/10**

- `min-h-[90vh]` hero works on mobile. Worker mini-cards use horizontal scroll with `scrollbar-none` — correct mobile pattern.
- Marquee is CSS-only. Mobile performance: ✓ (no JS).
- Client CTA: `flex-col md:flex-row` — correct responsive. But `max-w-4xl` at mobile causes content to be too wide.
- `text-5xl md:text-6xl lg:text-7xl` headline: correct responsive typography. But `tracking-tight` still wrong at all breakpoints.

**Pass 6 — Accessibility: 5/10**

- `prefers-reduced-motion: no-preference` correctly gates the marquee animation.
- Duplicate cards have `aria-hidden={i >= items.length}` — correct.
- Arrow SVG in CTA button has `aria-hidden="true"` — correct.
- `tracking-tight` on Korean text: reduces readability for Korean language users.
- Worker mini-cards are `<button>` elements opening signup modal — no `aria-label` describing what clicking does.
- No skip-to-content link for keyboard users.

**Pass 7 — AI Slop Risk: 8/10**
This does NOT look like AI slop. The marquee strip is genuinely differentiated (not a grid). The hero layout is editorial and restrained. The design references (read.cv × 오늘의집) are coherent and executed with taste. The client-cta dark block is a bit generic but intentional. Score high here — the "AI slop" problem was actively avoided.

---

## Design Phase Issues → TODOS

| ID    | File                                         | Issue                                           | Severity | Fix                                               |
| ----- | -------------------------------------------- | ----------------------------------------------- | -------- | ------------------------------------------------- |
| D-001 | `hero-section.tsx:23`                        | `tracking-tight` on Korean h1                   | Critical | Remove. No `tracking-*` on Korean text.           |
| D-002 | `how-it-works.tsx:27`                        | `tracking-tight` on Korean h2                   | Critical | Remove.                                           |
| D-003 | `client-cta.tsx:22,36`                       | `text-primary-foreground/50,/40`                | High     | Change to `/70` minimum. WCAG AA.                 |
| D-004 | `client-cta.tsx:13`                          | `max-w-4xl` exceeds 768px                       | High     | `max-w-2xl` or `max-w-3xl`.                       |
| D-005 | `portfolio-strip.tsx:47`                     | `bg-foreground/60` undefined token              | Medium   | Use `bg-neutral-800/70` or DESIGN.md badge token. |
| D-006 | `hero-section.tsx:18`, `how-it-works.tsx:49` | `rounded` → should be `rounded-sm`              | Medium   | Replace.                                          |
| D-007 | `hero-section.tsx:77`                        | Worker card click → signup modal (undocumented) | Medium   | Add comment or `aria-label`.                      |

---

## Phase 2 COMPLETE

Design: 5/10 → after fixes → 8/10 projected.
Critical: 2 (tracking-tight on Korean text). High: 2 (contrast, max-width). Medium: 3.
Dual voices: [subagent-only] (Codex unavailable).
Passing to Phase 3 (Eng Review).

---

<!-- /autoplan review started: 2026-04-13 -->

## Decision Audit Trail

| #   | Phase  | Decision                                              | Classification | Principle                        | Rationale                              | Rejected   |
| --- | ------ | ----------------------------------------------------- | -------------- | -------------------------------- | -------------------------------------- | ---------- |
| 1   | CEO    | Mode: SELECTIVE EXPANSION                             | Mechanical     | P3 (pragmatic)                   | Plan is post-hoc; existing scope clear | —          |
| 2   | CEO    | Candidate 1 (real data marquee): DEFER                | Mechanical     | P6 (bias to action, but blocked) | Needs N>8 real workers                 | Approach B |
| 3   | CEO    | Candidate 2 (worker count social proof): ADD to TODOS | Mechanical     | P1 (completeness)                | S effort, high trust signal            | —          |
| 4   | CEO    | Candidate 3 (JSON-LD SEO): ADD to TODOS               | Mechanical     | P1 (completeness)                | XS effort, SEO win                     | —          |
| 5   | CEO    | Candidate 4 (canonical URL): SURFACE to user          | Taste          | P5 (explicit vs clever)          | Architectural scope decision           | —          |
| 6   | CEO    | Candidate 5 (A/B tracking): DEFER                     | Mechanical     | P3 (pragmatic)                   | Premature without analytics            | —          |
| 7   | Design | D-001/D-002 tracking-tight: ADD to TODOS              | Mechanical     | P1 (completeness)                | Explicit DESIGN.md violation           | —          |
| 8   | Design | D-003 contrast fix: ADD to TODOS                      | Mechanical     | P1 (completeness)                | WCAG AA failure                        | —          |
| 9   | Design | D-004 max-w-4xl: ADD to TODOS                         | Mechanical     | P5 (explicit)                    | Exceeds layout constraint              | —          |
| 10  | Design | D-005/D-006/D-007: ADD to TODOS (medium)              | Mechanical     | P3 (pragmatic)                   | Token violations, low risk             | —          |

---

# /autoplan Phase 1: CEO Review

**Reviewed:** 2026-04-13 | **Mode:** SELECTIVE EXPANSION | **Branch:** main

---

## Pre-Review System Audit

**Current state:**

- 35 TODOS tracked, ~18 completed, ~17 open
- Most recently shipped: 포트폴리오 rooms UI (b86539b) — 1937-line component
- Active TODO comments: `ip: ''` 임시 placeholder in google/kakao strategies (security concern)
- Hottest files (30d): `api.ts`, `worker/[slug]/page.tsx`, `portfolio-form.tsx`, `navbar.tsx`, `hero-section.tsx`
- No stash, clean working tree except untracked `.claude/`, `.context/`, `PLAN.md`

**Critical observation:** The PLAN.md is a post-hoc doc of the landing page redesign (committed weeks ago). The actual current work is the portfolio rooms sprint — 5 commits, ~8K lines. The real plan to review is the gap between the docs and what shipped.

**Design doc found:** `heo-main-design-20260331-105103.md` (worker profile redesign, approved)

---

## 0A. Premise Challenge

**The stated problem:** "랜딩 페이지가 2019년식 SaaS 패턴이어서 올드하게 느껴짐"

Is this the right problem? Partially yes. The premise is sound — a portfolio service for blue-collar workers must look credible to clients. But there's a deeper question this plan doesn't address:

**Premise 1: "Clients will find workers via the landing page."**
Status: ASSUMED, not validated. The marquee shows mock portfolio cards. If clients arrive from Google searching "타일 시공업체 강남" they land on a worker's slug page, not the homepage. The landing is for _worker acquisition_, not client discovery. These are different designs.

**Premise 2: "The marquee solves discoverability."**
Status: QUESTIONABLE. The marquee uses static mock data. Real value only when N>50 actual workers. Until then it's marketing theater.

**Premise 3: "Current 3-step flow (가입→사진업로드→링크공유) is correct."**
Status: REASONABLE. Simple and honest. But "링크공유" as step 3 implies workers know who to share with — this skips the discovery problem entirely.

**What would happen if we did nothing?** Workers can still sign up and get a profile. The landing UX is not a blocker to the core loop. This was polish/brand work.

**Inversion:** What could make the landing actively harmful? Showing 8 fake portfolio cards to a real client who then expects that quality → disappointment when actual worker content is thin.

---

## 0B. Existing Code Leverage Map

| Sub-problem             | What already exists                         |
| ----------------------- | ------------------------------------------- |
| Display portfolio cards | `PortfolioStrip` (new marquee)              |
| Worker registration     | `SignupModal` + `useEffect` for `?signup=1` |
| Auth state              | Cookie-based authState (7ccfbfb)            |
| Navigation              | `Navbar` with mobile menu + user dropdown   |
| Page composition        | `app/page.tsx` orchestrates all sections    |
| Animation               | `globals.css` @keyframes marquee            |

**Rebuilding detection:** `DiscoveryGallery` was removed and replaced by `PortfolioStrip`. Not a rebuild — a replacement with a different design paradigm. Justified.

---

## 0C. Dream State Mapping

```
CURRENT STATE               THIS PLAN                   12-MONTH IDEAL
────────────────────────    ─────────────────────────    ───────────────────────────────────
Static mock cards           Marquee with mock cards       Real portfolio cards from DB
No hero social proof        Worker mini-cards in hero     Verified worker count + recent joins
Fixed 3-step flow           Same 3-step flow              Personalized flow based on referral
No SEO content              Same SEO content              Worker-specific landing pages
Landing → generic signup    Landing → signup modal        Landing → "request this worker" CTA
```

**Gap:** This plan improves visual quality but doesn't move toward the 12-month ideal meaningfully. The marquee will remain fake until there are enough real workers — the system doesn't yet have logic to pull real portfolios.

**Delta assessment:** This plan is brand work, not conversion work. The direction is right (premium look) but the 12-month target requires real data flowing through.

---

## 0C-bis. Implementation Alternatives

**APPROACH A: Marquee with mock data (implemented)**

```
Summary: Hardcode 8 portfolio cards, animate left.
Effort:  S
Risk:    Low
Pros:    - Ships immediately, looks polished
         - No DB query on public landing page
         - Performance: static, no hydration
Cons:    - Diverges from reality (mock ≠ real portfolio)
         - Will need replacement once real data exists
         - Credibility risk if clients inspect cards
Reuses:  existing Next.js SSG pattern
```

**APPROACH B: Real portfolio data from DB**

```
Summary: SSR/SSG fetch top 8-12 portfolios by latest/rating, show real work.
Effort:  M
Risk:    Med
Pros:    - Authentic content builds real trust
         - Keeps DB hot for landing page SEO
         - No "it's all fake" problem
Cons:    - Requires N>8 real portfolios to look good
         - Adds DB dependency to public landing page
         - Empty state during early stage
Reuses:  GET /public/portfolios endpoint (exists)
```

**APPROACH C: Hybrid — real data with fallback to mock**

```
Summary: Attempt DB fetch at build time (ISR), fall back to curated mock set.
Effort:  M
Risk:    Low
Pros:    - Real when available, mock when not
         - Graceful degradation
         - SEO-friendly
Cons:    - Two code paths to maintain
         - ISR revalidation adds complexity
Reuses:  Same GET /public endpoint
```

**RECOMMENDATION:** Approach C (Hybrid) is the right long-term architecture. The current Approach A is acceptable for now but accumulates debt when real workers start joining. Log Approach C as TODO.

---

## 0D. Mode-Specific Analysis (SELECTIVE EXPANSION)

**Complexity check:** Plan touches 8 files. No new classes/services. Not a smell — appropriate for a UI redesign.

**Minimum viable version:** The core value (visual refresh + marquee) was achieved. Footer cleanup and navbar improvements were appropriate scope.

**Expansion candidates identified:**

1. **Real portfolio data in marquee** — Hybrid fetch (Approach C). Effort S/M. Risk Low.
2. **Worker count social proof in hero** — "Currently X workers on BlueCollar." Effort S. Powerful trust signal.
3. **SEO: structured data (JSON-LD)** — Organization + WebSite schema in `<head>`. Effort S. Google rich snippets.
4. **Canonical URL strategy** — Subdomain routing means `slug.bluecollar.cv` gets no link equity from `bluecollar.cv`. Need canonical tags.
5. **Landing page A/B entry point** — `/?ref=kakao-ad` parameter tracking for conversion attribution.

Auto-decisions (SELECTIVE EXPANSION mode, 6 principles):

- Candidate 1: In blast radius (api.ts + portfolio-strip.tsx), <1d CC. → DEFER to TODOS.md (blocked on real data)
- Candidate 2: S effort, high impact. → ADD to TODOS.md
- Candidate 3: XS effort, SEO benefit. → ADD to TODOS.md
- Candidate 4: Architectural implication. → FLAG for user (see cherry-pick below)
- Candidate 5: Premature without analytics setup. → DEFER

---

## Section 1: Problem-Solution Fit

The landing page redesign is solving the right surface-level problem: the old design looked low-budget for a service targeting high-end tradespeople. The marquee is a clever way to communicate "this is a portfolio service" without words.

**Gap:** The `HowItWorks` section says "링크공유" (share your link) as the final step. This is worker-centric copy — a client arriving at the landing won't identify with this flow. Consider dual CTAs: one for workers (지금 시작하기) and one for clients (기술자 찾기 — even if disabled for now).

**Client/Worker distinction:** The current landing conflates the two sides of the marketplace. Everything from hero copy to CTA is aimed at worker recruitment. If a client lands here and doesn't see "find a worker" anywhere, they bounce.

---

## Section 2: Error & Rescue Registry

| Error                       | Trigger                                   | Visible? | Rescue                         | Tested? |
| --------------------------- | ----------------------------------------- | -------- | ------------------------------ | ------- |
| `?signup=1` param malformed | URL manipulation                          | No       | Silent no-op (useEffect check) | No      |
| SignupModal fails to open   | JS error in useEffect                     | No       | Page loads without modal       | No      |
| Marquee fails to animate    | CSS not loaded / `prefers-reduced-motion` | Partial  | Static cards shown             | No      |
| Router.replace fails        | Navigation API error                      | No       | Benign (URL keeps param)       | No      |

**Overall:** Low-risk section. No critical rescue gaps. Animation gracefully degrades. The `router.replace` failure is benign.

---

## Section 3: Failure Modes Registry

| Failure Mode                              | Probability | Impact           | Mitigation                    |
| ----------------------------------------- | ----------- | ---------------- | ----------------------------- |
| Mock cards exposed as fake                | Med         | Trust damage     | Replace with real data (TODO) |
| Landing client finds no "find worker" CTA | High        | Conversion loss  | Add client-side CTA (TODO)    |
| Subdomain SEO leak                        | Med         | SEO ranking loss | Add canonical tags (TODO)     |
| marquee animation jank on mobile          | Med         | UX regression    | Test on Safari/WebKit         |

---

## Section 4: Scope & Effort Calibration

The plan touched 8 files, introduced 2 new components. Appropriate scope for a UI refresh. No over-engineering detected. The marquee implementation (double array + CSS) is the right approach — no JS animation library needed.

---

## Section 5: Competitive Landscape

BlueCollar CV targets the blue-collar workforce credential market. Closest references:

- **오늘의집**: Strong portfolio-first UX, categories, before/after. Directly referenced in design doc.
- **read.cv**: Editorial whitespace, minimal. Directly referenced.
- **숨고/크몽**: Service marketplace, not portfolio. Different model.

The redesign moves toward the right references. No competitive issues with the landing approach.

---

## Section 6: Observability & Monitoring

**Gap:** No analytics on landing page CTAs. Can't answer: "What % of landing page visitors click signup?" This is P2 — needed before any meaningful optimization.

Currently: No `gtag`, no Mixpanel, no custom events. The landing ships blind.

---

## Section 7: Security Assessment

**ip: '' placeholder** in `google.strategy.ts:112` and `kakao.strategy.ts:127` — IP is logged as empty string in auth events. This is an audit gap, not an active vulnerability. But if this is used for rate limiting or fraud detection, it's a real problem.

**No security issues in the landing page itself.** Static HTML + CSS + client-side JS. The `router.replace` pattern is safe.

---

## Section 8: Data Model

The landing page has no new data model changes. Mock data is hardcoded in `portfolio-strip.tsx`. No concern here.

**Separate observation (not landing scope, but surfaced):** The portfolio rooms feature (b86539b) creates rooms and media but does NOT bind `roomId` to media items. The frontend comment says "roomId 바인딩은 추후 2-phase API 지원 후 추가." This means `portfolioMedia.roomId` is always NULL for newly created portfolios, breaking the core UX promise of "photos grouped by room." This is a P1 bug in the rooms feature, NOT the landing page.

---

## Section 9: Performance

**Marquee animation:** CSS-only via `@keyframes`. Zero JS overhead. Correct choice.

**LCP concern (from TODO-022):** Not in landing scope, but the marquee images use `next/image` — verify `priority` is set on first visible image in the marquee strip.

**Page weight:** Landing page imports 6 components. All are client-rendered (`"use client"` in page.tsx). SSR would be better for First Contentful Paint. The `useEffect` for `?signup=1` forces the whole page to be a client component. This is a minor performance miss.

---

## Section 10: Test Coverage

**Current tests for landing components:** None found.

- `portfolio-strip.tsx`: No spec
- `hero-section.tsx`: No spec
- `how-it-works.tsx`: No spec
- `client-cta.tsx`: No spec

This is a UI-only redesign, so unit tests are lower priority. But the `page.tsx` signup modal trigger logic (`useEffect` + `router.replace`) has no test coverage. That's a real behavioral flow.

---

## Section 11: Design Review (UI scope detected)

**Design system compliance check:**

- `hero-section.tsx`: Uses `#FF6B00` → Check if this is `text-brand` from CSS var. (DESIGN.md says primary orange restricted to CTA/links/focus ring)
- `portfolio-strip.tsx`: Cards with `rounded-xl` — check against DESIGN.md radius hierarchy (`rounded-md` for cards)
- `client-cta.tsx`: `max-w-4xl` inset card — check border vs shadow (DESIGN.md says `border border-border` not shadow)

These are **design system compliance issues**, not visual bugs. Deferred to Phase 2 (Design Review) for detailed assessment.

---

## What Already Exists

| Sub-problem       | Existing code                                    |
| ----------------- | ------------------------------------------------ |
| Signup flow       | `SignupModal` + `apps/front/app/onboarding/`     |
| Worker profiles   | `apps/front/app/worker/[slug]/`                  |
| API layer         | `apps/front/lib/api.ts`                          |
| Portfolio display | `apps/front/components/worker/project-modal.tsx` |
| Auth              | Cookie-based authState, middleware.ts            |

---

## NOT in Scope (deferred)

| Item                              | Reason                                  | Destination |
| --------------------------------- | --------------------------------------- | ----------- |
| Real portfolio data in marquee    | Blocked on N>8 real workers             | TODO-036    |
| Worker count social proof         | Requires COUNT query + caching          | TODO-037    |
| JSON-LD structured data           | SEO improvement, non-blocking           | TODO-038    |
| Canonical URL tags                | Subdomain SEO architecture question     | TODO-039    |
| Landing analytics (CTR tracking)  | No analytics infra yet                  | TODO-040    |
| Client-facing "find a worker" CTA | Product decision needed                 | TODO-041    |
| roomId binding in portfolio media | P1 bug in rooms feature, separate issue | TODO-042    |

---

## Dream State Delta

Where this plan leaves us vs. 12-month ideal:

- DONE: Visual language is premium, marquee is on-brand
- MISSING: Real data flowing through, client-side discovery path, SEO foundations, analytics

---

## CEO Completion Summary

| Dimension               | Assessment                                                               |
| ----------------------- | ------------------------------------------------------------------------ |
| Problem-solution fit    | Correct direction, wrong frame (worker-acquisition vs client-conversion) |
| Scope calibration       | Appropriate for polish sprint                                            |
| Competitive positioning | Moving toward right references (read.cv + 오늘의집)                      |
| Technical risk          | Low                                                                      |
| Critical gaps           | P1: roomId binding bug in rooms feature (separate from this plan)        |
| Deferred items          | 7 items → TODOS.md                                                       |
| Mode                    | SELECTIVE EXPANSION                                                      |

---

## Phase 1 Premises (GATE — user confirmation required)

**Premises I'm accepting as given:**

1. BlueCollar CV is a blue-collar worker portfolio + client-discovery marketplace
2. Workers create profiles, clients browse and contact them
3. The landing page is primarily for worker acquisition (not client discovery)
4. The marquee with mock data is acceptable short-term while real workers join
5. Mobile-first is the correct default

**Premises I'm challenging:**

- P3 should be "landing is for BOTH workers AND clients" — the current design ignores clients entirely

---

## CEO Dual Voices

### CODEX SAYS (CEO — strategy challenge)

`[unavailable — OpenAI 401 Unauthorized. Single-model mode.]`

### CLAUDE SUBAGENT (CEO — strategic independence)

5 findings:

1. **Brand problem framed as growth problem** (Critical) — visual redesign doesn't solve cold start; reframe around referral-chain digitization, not portfolio building
2. **Three unvalidated premises** (High) — client discovers via landing? worker wants public URL? photos prove quality for all trades? None validated with real users
3. **Rooms UI before worker acquisition** (Critical) — 1937-line component shipped before 50 workers exist; roomId binding is already broken (NULL); complexity ahead of its time
4. **Alternative GTM models unevaluated** (High) — inbound client lead model (숨고 style) and agency/foreman model never analyzed
5. **당근마켓 is the real threat** (Critical) — 35M MAU, neighborhood trust, launching Pro tier; only moat is trade license verification + legal proof trail

```
CEO DUAL VOICES — CONSENSUS TABLE: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   NO      N/A    [subagent-only]
  2. Right problem to solve?           PARTLY  N/A    [subagent-only]
  3. Scope calibration correct?        NO      N/A    [subagent-only]
  4. Alternatives sufficiently explored? NO    N/A    [subagent-only]
  5. Competitive/market risks covered?  NO     N/A    [subagent-only]
  6. 6-month trajectory sound?          NO     N/A    [subagent-only]
═══════════════════════════════════════════════════════════════
CONFIRMED = both agree. DISAGREE = models differ.
[subagent-only] = Codex unavailable; Claude subagent signal only.
```

**Key cross-phase signal (pre-Phase 3):** The rooms feature (`portfolio-form.tsx`, `roomId` always NULL) is a P1 data integrity bug that will affect the Eng Review in Phase 3.

---

## Phase 1 COMPLETE

**CEO Completion Summary:**

- Premises challenged: 3 invalid/unvalidated, 2 reasonable
- Alternatives explored: 3 marquee approaches identified
- Expansion candidates: 7 items → TODOS.md
- Critical findings: 2 (rooms before acquisition, 당근마켓 competitive threat)
- Mode: SELECTIVE EXPANSION
- Dual voices: [subagent-only] (Codex unavailable)

Proceed to Phase 2 (Design Review) pending premise confirmation.

---

# /autoplan Phase 3: Eng Review

**Reviewed:** 2026-04-13 | **Branch:** main | **Mode:** SELECTIVE EXPANSION

---

## Architecture Snapshot

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BLUECOLLAR CV — DEPENDENCY MAP                   │
│                                                                         │
│  [Browser]                                                              │
│     │                                                                   │
│     ▼                                                                   │
│  [Next.js 14 / Cloudflare Workers]                                      │
│     │   apps/front/app/page.tsx                                         │
│     │   ├── HeroSection (static mock workers)                           │
│     │   ├── PortfolioStrip (static mock portfolios)                     │
│     │   ├── HowItWorks (static)                                         │
│     │   └── ClientCTA (static)                                          │
│     │                                                                   │
│     │   apps/front/app/dashboard/                                       │
│     │   └── portfolio-form.tsx  ←── P1 BUG: roomId always NULL         │
│     │          │                                                        │
│     │          └── POST /api/portfolios                                 │
│     │                   │                                               │
│     ▼                   ▼                                               │
│  [NestJS / Fastify — port 4000]                                         │
│     │   JwtAuthGuard → JWT subject → workerProfileId  ← IDOR RISK      │
│     │                                                                   │
│     ├── portfolio.service.ts                                            │
│     │   ├── Step 1: INSERT portfolio                                    │
│     │   ├── Step 2: INSERT tags                                         │
│     │   ├── Step 3: INSERT details                                      │
│     │   ├── Step 4: INSERT portfolioRooms  (returns rows, no IDs back) │
│     │   └── Step 5: INSERT portfolioMedia  (roomId = NULL always)      │
│     │                                                                   │
│     └── public.service.ts                                               │
│         └── .orderBy(t.createdAt)  ← ASC bug (oldest first)            │
│                                                                         │
│  [PostgreSQL — Docker Compose]                                          │
│     ├── portfolioRooms (roomTypeEnum: 9 values)                        │
│     └── portfolioMedia  (roomId FK — always NULL in practice)          │
│                                                                         │
│  [Schema Package] @repo/schema                                          │
│     └── roomTypeEnum: LIVING|BATHROOM|KITCHEN|BEDROOM|BALCONY|         │
│                        OTHER|ENTRANCE|UTILITY|STUDY  (9 values)        │
│                                                                         │
│  [Frontend local type]                                                  │
│     └── RoomType: LIVING|BATHROOM|KITCHEN|BEDROOM|BALCONY|OTHER (6)    │
│                        ↑ MISSING: ENTRANCE, UTILITY, STUDY             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Test Coverage Diagram

```
CODE PATH COVERAGE
══════════════════════════════════════════════════════════════════════════
  Path                                          Covered?   Notes
  ──────────────────────────────────────────── ─────────  ─────────────
  POST /portfolios — happy path                 NO         No spec
  POST /portfolios — rooms creation             NO         No spec
  POST /portfolios — media upload               NO         No spec
  POST /portfolios — roomId binding             NO         P1 bug path untested
  POST /portfolios — IDOR workerProfileId       NO         Security path untested
  GET  /public/portfolios — sort order          NO         ASC bug untested
  Portfolio form: canProceed logic              NO         No spec
  Portfolio form: image type selection          NO         No spec
  RoomType enum exhaustiveness                  NO         No spec
  Auth guard JWT-subject extraction             NO         No spec
══════════════════════════════════════════════════════════════════════════

USER FLOW COVERAGE
══════════════════════════════════════════════════════════════════════════
  Flow                                          E2E?  Unit?  Notes
  ──────────────────────────────────────────── ───── ─────  ─────────────
  Worker signs up → onboarding                 NO    NO     No test
  Worker creates portfolio (4-step form)       NO    NO     No test
  Portfolio rooms saved → rooms visible        NO    NO     P1 bug masks this
  Client views worker profile                  NO    NO     No test
  Client views latest portfolios (homepage)    NO    NO     Sort bug masks this
  Marquee images load (LCP)                    NO    NO     No perf test
══════════════════════════════════════════════════════════════════════════
```

**Coverage summary:** 0% on all new feature paths. No unit tests, no E2E tests for any portfolio flow.

---

## Eng Dual Voices

### CODEX SAYS (Eng — technical challenge): `[unavailable — OpenAI 401]`

### CLAUDE SUBAGENT (Eng — independent review)

5 findings, independently confirmed:

**P1 — roomId permanently NULL (data integrity)**
`portfolio.service.ts` Step 4 inserts portfolioRooms rows but does NOT use `.returning()` to get back the generated IDs. Step 5 inserts portfolioMedia with `if (mediaItem.roomId) record.roomId = mediaItem.roomId` — always false because frontend never sends roomId (comment: "추후 2-phase API 지원 후 추가"). Result: every portfolio media item is stored with `roomId = NULL`. The rooms grouping feature is dead. Every portfolio created since b86539b has broken room associations.

**Fix path:** Server-side `roomIndex` correlation — no frontend API change needed.

1. Add `roomIndex?: number` to `CreatePortfolioMediaPayload` DTO
2. Frontend: `rooms.flatMap((r, rIdx) => r.images.map(img => ({ ...img, roomIndex: rIdx })))`
3. Backend Step 4: use `.returning({ id: portfolioRooms.id })` to capture inserted IDs
4. Backend Step 5: map `insertedRooms[mediaItem.roomIndex]?.id` to roomId

Estimated: ~2h implementation, ~30min test.

**High — IDOR: workerProfileId accepted from request body**
`portfolio.service.ts` (and likely the DTO) accepts `workerProfileId` directly from the client payload. An authenticated worker could pass any `workerProfileId` and create a portfolio attributed to another worker. Fix: derive `workerProfileId` from JWT subject in the controller, never from request body.

**Medium — RoomType enum drift (6 vs 9 values)**
Frontend `portfolio-form.tsx` defines a local `RoomType` type with 6 values. Schema `roomTypeEnum` has 9 values (adds ENTRANCE, UTILITY, STUDY). If a room type is added to the DB enum, the frontend form will silently omit it. Fix: generate RoomType from `@repo/schema` roomTypeEnum values, not hardcoded local type.

**Medium — No server-side media count enforcement**
`MAX_IMAGES_PER_ROOM = 10` and `MAX_TOTAL_IMAGES = 50` are defined in `portfolio-form.tsx` as client-side constants only. `portfolio.service.ts` has no corresponding validation. A direct API call can create unlimited media records per portfolio. Fix: add service-level count guard before media inserts.

**Low — `any` cast in image type handling**
`portfolio-form.tsx:~620` uses `as any` or unchecked cast when mapping `img.imageType` to the DTO. If `imageType` is undefined or mismatched, it silently passes through instead of failing at the Zod boundary.

```
ENG DUAL VOICES — CONSENSUS TABLE: [subagent-only]
═══════════════════════════════════════════════════════════════
  Dimension                              Claude  Codex  Consensus
  ─────────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?                  NO      N/A    [subagent-only]
  2. Data integrity safe?                 NO      N/A    P1 roomId bug
  3. Security surface OK?                 NO      N/A    IDOR risk
  4. Test coverage adequate?              NO      N/A    0% coverage
  5. Schema/frontend in sync?             NO      N/A    6 vs 9 enum values
  6. Error handling complete?             NO      N/A    No server limits
═══════════════════════════════════════════════════════════════
CONFIRMED = both agree. [subagent-only] = Codex unavailable.
```

---

## Eng Findings Summary

| ID    | Finding                                        | Severity | File                         | Fix                               | Est.  |
| ----- | ---------------------------------------------- | -------- | ---------------------------- | --------------------------------- | ----- |
| E-001 | roomId permanently NULL — room grouping broken | P1       | `portfolio.service.ts:~215`  | roomIndex correlation (see above) | 2h    |
| E-002 | IDOR: workerProfileId from request body        | High     | `portfolio.service.ts` + DTO | Derive from JWT subject           | 30min |
| E-003 | RoomType enum drift (frontend 6 vs schema 9)   | Medium   | `portfolio-form.tsx:~30`     | Import from @repo/schema          | 1h    |
| E-004 | No server-side media count limit               | Medium   | `portfolio.service.ts`       | Add guard before media inserts    | 1h    |
| E-005 | Portfolio list orderBy ASC (should be DESC)    | Medium   | `public.service.ts:90`       | `.orderBy(desc(t.createdAt))`     | 5min  |
| E-006 | `any` cast in imageType mapping                | Low      | `portfolio-form.tsx:~620`    | Explicit Zod parse                | 30min |

---

## NOT in Scope (Eng Phase)

| Item                                 | Reason                             |
| ------------------------------------ | ---------------------------------- |
| Landing page CSS fixes (D-001–D-007) | Design phase, not eng              |
| Auth strategy IP placeholder         | Surfaced in CEO phase, separate PR |
| Real data in marquee                 | Blocked on data, TODO-036          |
| E2E test suite setup                 | Separate infra work                |

---

## What Already Exists

| Problem area                  | Existing code                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Multi-step portfolio creation | `portfolio.service.ts` — Drizzle transaction (Steps 1-7)                       |
| Room schema                   | `packages/database/src/schema.ts` — portfolioRooms table + roomTypeEnum        |
| Media schema                  | `packages/database/src/schema.ts` — portfolioMedia table with roomId FK        |
| Auth guard                    | `JwtAuthGuard` + JWT strategy — JWT subject available                          |
| Client-side validation        | `portfolio-form.tsx` — `canProceed`, `MAX_IMAGES_PER_ROOM`, `MAX_TOTAL_IMAGES` |
| Public portfolio list         | `public.service.ts` — GET endpoint exists                                      |

---

## Failure Modes Registry (Eng additions)

| Failure Mode                                       | Probability                    | Impact           | Mitigation               |
| -------------------------------------------------- | ------------------------------ | ---------------- | ------------------------ |
| Room grouping never works                          | CONFIRMED                      | Feature broken   | E-001 fix (roomIndex)    |
| Worker A creates portfolio as Worker B             | Low (authenticated users)      | Data corruption  | E-002 fix (IDOR)         |
| Frontend skips room types (ENTRANCE/UTILITY/STUDY) | Med (when added to UI)         | Silent data loss | E-003 fix (enum import)  |
| Unlimited media upload via API                     | Low (requires direct API call) | DB bloat         | E-004 fix (server guard) |
| Public portfolio list shows oldest first           | CONFIRMED                      | UX regression    | E-005 fix (5 min)        |

---

## Decision Audit Trail (Eng additions)

| #   | Phase | Decision                                       | Classification | Principle               | Rationale                            | Rejected             |
| --- | ----- | ---------------------------------------------- | -------------- | ----------------------- | ------------------------------------ | -------------------- |
| 11  | Eng   | E-001 roomId: ADD fix to TODOS (P1)            | Mechanical     | P1 (completeness)       | Feature dead without fix             | 2-phase API approach |
| 12  | Eng   | E-002 IDOR: ADD fix to TODOS (High)            | Mechanical     | P1 (completeness)       | Security boundary violation          | —                    |
| 13  | Eng   | E-003 enum drift: ADD fix to TODOS             | Mechanical     | P5 (explicit vs clever) | Schema is source of truth            | Local type           |
| 14  | Eng   | E-004 server limit: ADD fix to TODOS           | Mechanical     | P1 (completeness)       | Client validation alone insufficient | —                    |
| 15  | Eng   | E-005 sort order: ADD fix to TODOS (quick win) | Mechanical     | P3 (pragmatic)          | 5-min fix, real UX impact            | —                    |

---

## Eng Completion Summary

| Dimension      | Assessment                                                       |
| -------------- | ---------------------------------------------------------------- |
| Architecture   | Correct layering (DDD pattern), but Step 4→5 data flow is broken |
| Data integrity | P1 failure — roomId NULL for all portfolios since b86539b        |
| Security       | IDOR risk on portfolio create — fix before any public launch     |
| Test coverage  | 0% on all new feature paths — no unit, no E2E                    |
| Schema sync    | Frontend enum drifted from DB — will cause silent omissions      |
| Quick wins     | E-005 (5-min sort fix) should ship immediately                   |

**Eng Phase: COMPLETE**

---

# /autoplan Phase 4: Approval Gate — APPROVED

**Date:** 2026-04-13 | **User choice:** Approve — fix P1s first

## Fixes Shipped (same session)

| TODO         | Fix                                           | File(s)                                                                           | Status |
| ------------ | --------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| TODO-044/045 | Remove `tracking-tight` from Korean headings  | `hero-section.tsx:23`, `how-it-works.tsx:26`                                      | DONE   |
| TODO-033     | `orderBy ASC → DESC` on public portfolio list | `public.service.ts:90`                                                            | DONE   |
| TODO-042     | `roomId NULL` bug — roomIndex correlation     | `portfolio.service.ts`, `create-portfolio.dto.ts`, `portfolio-form.tsx`, `api.ts` | DONE   |

**Build:** `pnpm build` — 0 errors, 4 tasks successful.
**Formatter:** `pnpm prettier --write` — all files unchanged (already formatted).

## Remaining (tracked in TODOS.md)

- TODO-036–041: CEO phase (landing real data, social proof, SEO, analytics, client CTA)
- TODO-043: IDOR check — already guarded at controller level (user.workerProfileId check exists)
- TODO-046–049: Design compliance (contrast, max-w, token, badge radius)
- TODO-050–051: Eng quality (enum import, server media limit)

## Test Plan

Saved: `~/.gstack/projects/jae-tech-bluecollar/main-test-plan-20260413-100051.md`

**autoplan COMPLETE** — 2026-04-13
