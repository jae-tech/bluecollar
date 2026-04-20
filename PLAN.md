<!-- /autoplan restore point: /c/Users/heo/.gstack/projects/jae-tech-bluecollar/main-autoplan-restore-20260420-090917.md -->

# Plan: 포트폴리오 모달 완성 · 검색 UX 폴리시 스프린트

**Branch:** main
**Date:** 2026-04-20
**Status:** APPROVED — 구현 시작 가능

---

## Problem Statement

사용자 요청: "다음 진행해"

이전 스프린트에서 포트폴리오 모달 UX 개선(방 탭, 캐러셀), 검색 API 실연결, 의뢰 폼 API 통합까지 완료됨.
남은 TODO들을 Priority 기준으로 정리하면 두 개의 자연스러운 클러스터가 있음:

1. **모달 완성 (버그/성능)**: TODO-063, 064, 069~073 — 모달이 올바르게 작동하지 않는 엣지 케이스들. 사용자가 데이터 손실을 경험하거나 화면이 깨질 수 있는 수준.
2. **포트폴리오 발견성 (UX)**: TODO-074~077 — 고객이 특정 시공 사례를 공유하거나 접근하는 경로 개선.

이 두 클러스터를 하나의 스프린트로 처리. 가치 대비 구현 비용이 모두 XS~S 수준.

**점검 대상:**
- `apps/front/components/worker/portfolio-detail-modal.tsx` — 주요 파일
- `apps/api/src/domains/portfolio/services/portfolio.service.ts` — roomIndex OOB
- `apps/front/app/globals.css` — keyframes 이전
- `apps/front/app/worker/[slug]/page.tsx` — deep link 연동

---

## Scope

### In scope

**버그/성능 (P1):**
- TODO-063: close button `rounded-full` → `rounded-md`
- TODO-064: Desktop left panel empty state — `md:hidden` 제거
- TODO-069: 인라인 keyframes → `globals.css` 이전 (매 렌더마다 재주입 방지)
- TODO-070: roomIndex OOB — `BadRequestException` 가드 (백엔드)
- TODO-071: body overflow lock 스택 처리 (두 모달 동시 마운트 시 잠금 해제 버그)
- TODO-072: `ImageCarousel priority` prop — 최상위 캐러셀만 high-priority
- TODO-073: `roomGroups useMemo` — O(n×m) 필터 렌더마다 재실행 방지

**UX 개선 (P2):**
- TODO-074: 포트폴리오 deep link — `?portfolio=[id]` 쿼리 파라미터
- TODO-075: 캐러셀 키보드 방향키 네비게이션
- TODO-076: 모바일 스와이프 제스처 (CSS scroll-snap)
- TODO-077: 모달에서 워커 프로필 링크

### Not in scope (defer)
- TODO-005: 온보딩 완료 화면 (별도 스프린트)
- TODO-034/035: 검색 고급 필터 (데이터 축적 후)
- TODO-039: SEO 전략 (팀 논의 필요)
- TODO-040: Analytics 인프라 (별도 결정)
- TODO-078: Before 사진 업로드 wizard (콘텐츠 전략 스프린트)

---

## Sub-problems → Existing Code Mapping

| Sub-problem | 파일 |
|-------------|------|
| close button radius | `components/worker/portfolio-detail-modal.tsx:~359` |
| empty state desktop | `components/worker/portfolio-detail-modal.tsx:~403-410` |
| keyframes 이전 | `components/worker/portfolio-detail-modal.tsx:~621-624`, `app/globals.css` |
| roomIndex OOB | `apps/api/src/domains/portfolio/services/portfolio.service.ts:~520` |
| overflow lock 스택 | `components/worker/portfolio-detail-modal.tsx:~262` |
| ImageCarousel priority | `components/worker/portfolio-detail-modal.tsx` + `ImageCarousel` 컴포넌트 |
| roomGroups useMemo | `components/worker/portfolio-detail-modal.tsx:~297-316` |
| deep link | `app/worker/[slug]/page.tsx` + `portfolio-detail-modal.tsx` |
| 키보드 방향키 | `ImageCarousel` 컴포넌트 |
| 모바일 스와이프 | `ImageCarousel` 컴포넌트 |
| 프로필 링크 | `portfolio-detail-modal.tsx` (view 모드 CTA) |

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|---------|
| 1 | CEO | Approach B (풀 스프린트 — 버그+UX 모두) | Mechanical | P1, P2 | CC에서 M 작업은 30min, 딥링크가 핵심 가치 | A (버그만) |
| 2 | CEO/Arch | deep link: useSearchParams → window.history.pushState | Mechanical | P5 | Suspense 없이 동작, 빌드 경고 없음 | useSearchParams |
| 3 | CEO/Expand | OG 태그 추가 → DEFER TODOS.md | Mechanical | P3 | 별도 SEO 스프린트에 포함 | 이번 scope 추가 |
| 4 | CEO/Expand | Server Component 전환 → DEFER | Mechanical | P3 | L effort, 아키텍처 변경 큼 | 이번 scope 추가 |
| 5 | Design | 스와이프: CSS scroll-snap → touchstart delta 방식 | Mechanical | P5 | scroll-snap은 DOM 스크롤이라 useState(idx)와 동기화 불가. touchend delta 감지 후 setIdx() | CSS scroll-snap |
| 6 | Design | arrow key 스코프: ImageCarousel div에 tabIndex={0} + onKeyDown | Mechanical | P5 | 모달 수준 keydown이면 페이지 스크롤 막힘. 캐러셀에 포커스 있을 때만 동작 | 모달 수준 전역 |
| 7 | Design | 프로필 링크: CTA 워커 이름 아래 텍스트 링크 `프로필 전체보기 →` | Mechanical | P2 | primary CTA 방해 없이 secondary access path 제공 | 별도 버튼 추가 |
| 8 | Design | 데스크탑 empty state: Camera 아이콘 + 2줄 텍스트 (모바일과 동일 패턴) | Mechanical | P1 | 빈 패널에 텍스트만 달랑 — empty state is a feature | 텍스트만 |

## Implementation Specs (Design Phase 추가)

### TODO-075: 키보드 방향키 — `ImageCarousel`
```
- ImageCarousel div에 tabIndex={0} 추가
- onKeyDown: ArrowLeft → prev, ArrowRight → next
- e.preventDefault() — 페이지 스크롤 방지
- 포커스 ring: focus-visible:ring-2 focus-visible:ring-primary/40
```

### TODO-076: 모바일 스와이프 — touchstart delta
```
- touchStart: record clientX
- touchEnd: if (startX - endX > 50) → next; if (endX - startX > 50) → prev
- 기존 setIdx() 그대로 사용 — state sync 문제 없음
- CSS scroll-snap 미사용 (Decision #5)
```

### TODO-064: 데스크탑 empty state
```
- md:hidden 제거
- 내용: <Camera size={24} className="text-muted-foreground mx-auto mb-2" />
         <p className="text-sm text-muted-foreground">아직 시공 사진이 없습니다.</p>
         [edit 모드] <p className="text-xs text-muted-foreground">사진을 추가해보세요.</p>
```

### TODO-077: 프로필 링크 — view 모드 CTA
```
- 워커 이름 아래: <a href="/worker/{slug}" className="text-xs text-primary hover:underline">프로필 전체보기 →</a>
- slug prop: PortfolioDetailModal에 workerSlug?: string 추가
- slug 없으면 링크 미표시
```

### TODO-074: Deep link — URL 상태
```
- 모달 열릴 때: window.history.pushState({}, '', `?portfolio=${portfolio.id}`)
- 모달 닫힐 때: window.history.pushState({}, '', window.location.pathname)
- 초기 로드: useEffect([portfolios], () => { id = new URLSearchParams(location.search).get('portfolio'); if (id) setSelectedPortfolio(find(id)) })
- popstate 이벤트: 뒤로가기 시 모달 닫힘
- [ENG P1] popstate listener MUST be removed in useEffect cleanup:
  useEffect(() => {
    const handler = () => setSelectedPortfolio(null);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
```

---

## Error & Rescue Registry

| 코드패스 | 실패 케이스 | 현재 처리 | Gap |
|---------|------------|-----------|-----|
| roomIndex OOB (portfolio.service.ts:252) | idx >= insertedRooms.len | silent null (data loss) | BadRequestException 추가 필요 |
| overflow lock (modal:403) | 2 모달 동시 언마운트 | raw style="" | counter 클래스 방식으로 교체 |
| deep link 로딩 race | portfolios 로딩 중 URL 접근 | no-op | useEffect dep [portfolios, id] 추가 |
| keydown 리스너 | 모달 닫힌 상태 키 입력 | 전역 활성 | portfolio!=null guard 추가 |

## Failure Modes Registry

| 실패 모드 | 심각도 | 발생 확률 | 완화 방안 |
|----------|-------|---------|---------|
| roomIndex OOB → null roomId | HIGH | Low | BadRequestException (TODO-070) |
| overflow 스택 없음 → 스크롤 해제 | MED | Med | counter 클래스 방식 (TODO-071) |
| priority 경합 → LCP 저하 | LOW | High | isPrimary prop (TODO-072) |
| deep link 로딩 race | LOW | Low | dep fix |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean | 2 critical gaps: OOB, overflow lock |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score: 6/10 → 8/10, 4 decisions |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | clean | 3 issues found (popstate cleanup, overflow counter, OOB guard) |

**VERDICT:** APPROVED — CEO + Design + Eng 완료. 구현 시작 가능.
