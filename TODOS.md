# BlueCollar CV — Design TODOs

Generated from `/plan-design-review` on 2026-03-30.

---

## 🎨 브랜드 & 디자인 시스템

### TODO-001: 오렌지 브랜드 컬러를 CSS 변수로 정의
**What:** `globals.css`에 `--brand` 변수 추가. 현재 `fill="#FF6B00"`이 `hero-section.tsx:174`에 하드코딩.
**Why:** 전체 앱에서 브랜드 컬러를 일관되게 사용하고, 나중에 한 곳에서 바꿀 수 있어야 함.
**Pros:** 컬러 시스템 일관성, 향후 다크모드 확장 시 단 하나의 변수만 수정
**Cons:** 기존 하드코딩된 값 모두 교체 필요
**Context:** `--primary`는 검정 유지 (접근성). 오렌지는 아이콘, 강조 포인트, 뱃지 배경에만 사용.
**Depends on:** 없음

```css
/* globals.css에 추가 */
--brand: oklch(0.65 0.20 40); /* ≈ #FF6B00 계열 */
```

---

### TODO-002: 주요 CTA 버튼에 shadcn `<Button>` 컴포넌트 통일
**What:** `hero-section.tsx`의 raw `<button>` 태그를 shadcn `Button` 컴포넌트로 교체.
**Why:** 현재 hero 버튼은 `<button>`, 다른 곳은 `<Button>` 혼용 → 스타일 불일관, type 속성 누락
**Pros:** 버튼 스타일 한 곳에서 관리, 접근성 자동 처리
**Cons:** hero-section 버튼의 커스텀 그림자(`shadow-lg shadow-primary/20`) 를 Button variant에 추가해야 함
**Context:** `components/ui/button.tsx`에 `cta` variant 추가 고려
**Depends on:** 없음

---

### TODO-003: Hero floating badge 모바일 대응
**What:** `hero-section.tsx`의 `-top-4 -right-4`, `-bottom-4 -left-4` floating badge들이 모바일에서 화면 밖으로 나갈 수 있음.
**Why:** 375px 화면에서 `max-w-lg` 카드 + `-4` offset = 화면 넘침 가능성
**Pros:** 모바일 UX 개선, 레이아웃 깨짐 방지
**Cons:** 없음
**Context:** `sm:block hidden`으로 모바일에서 숨기거나, 카드 내부 상단/하단에 인라인 배치로 변경
**Depends on:** 없음

---

## 🔄 상태 관리 (API 연결 준비)

### TODO-004: InquiryForm 상태 (Loading/Error/Success)
**What:** `components/worker/inquiry-form.tsx`에 제출 중 Spinner, 에러 Toast, 성공 메시지 추가
**Why:** 현재 form은 submit 후 아무 일도 안 일어남 — API 연결 시 UX 없음
**Pros:** API 연결 후 즉시 동작하는 UX
**Cons:** 없음
**Context:**
- Loading: 버튼 disabled + Spinner
- Error: Toast "전송 실패. 다시 시도해주세요"
- Success: 폼 숨기고 "문의가 전송되었습니다. 워커가 48시간 내 응답할 예정입니다" 표시
**Depends on:** API 엔드포인트 (`POST /inquiries`)

---

### TODO-005: 온보딩 완료 화면 (`/onboarding/complete`)
**What:** 5단계 완료 후 축하 화면 추가. 현재는 바로 프로필 페이지로 이동.
**Why:** 현장 전문가가 생애 첫 디지털 프로필을 만든 순간 — 축하 없이 그냥 이동하면 모멘텀 없음
**Pros:** 활성화율 향상, 공유 유도 (KakaoTalk 공유 버튼)
**Cons:** 라우트 하나 추가 필요
**Context:**
- 큰 텍스트: "[이름]님의 프로필이 완성됐어요!"
- 프로필 URL 표시 + 복사 버튼
- KakaoTalk 공유 버튼
- "내 프로필 보기" CTA
**Depends on:** 온보딩 완료 API 응답 (slug 포함)

---

### TODO-006: 워커 프로필 페이지 Skeleton 로딩
**What:** `/worker/[slug]` 에 loading state — avatar, stats, portfolio grid 모두 Skeleton
**Why:** 현재 mock 데이터라 즉시 로드되지만 API 연결 시 빈 화면 순간 발생
**Pros:** API 연결 후 즉시 동작
**Cons:** 없음
**Context:** Next.js `loading.tsx` 파일 추가 or `Suspense` + `fallback` 처리
**Depends on:** API 엔드포인트 (`GET /workers/:slug`)

---

## 🗺️ 아키텍처

### TODO-007: 워커 대시보드 라우트 계획 (`/dashboard`)
**What:** 로그인 후 워커가 돌아올 홈 — 내 프로필, 문의함, 통계
**Why:** 현재 로그인 UI가 없고, 온보딩 완료 후 재방문 경험이 없음
**Pros:** 리텐션 기반 설계
**Cons:** 인증 시스템 먼저 필요
**Context:** v2 구현 OK. 지금은 라우트만 계획에 포함 (`/dashboard`)
**Depends on:** 인증(로그인) 시스템

---

### TODO-008: Navbar에서 '프로젝트 의뢰' 링크 제거
**What:** `components/navbar.tsx`에서 '프로젝트 의뢰' nav 항목 제거
**Why:** v1은 워커 중심. 의뢰인 사이드는 v2. 데드 링크는 사용자 신뢰를 깎음.
**Pros:** 단순한 네비게이션, 데드 링크 제거
**Cons:** 없음
**Context:** navbar 구조: `워커 탐색 | 서비스 소개 | 로그인/시작하기`
**Depends on:** 없음 (즉시 가능)

---

### TODO-009: ThemeProvider를 라이트모드 전용으로 고정
**What:** `components/theme-provider.tsx`에 `forcedTheme="light"` 설정, 또는 ThemeProvider 제거
**Why:** CSS dark 변수는 있지만 toggle UI 없고 오렌지 컬러가 다크모드에서 검증 안 됨. v1은 라이트모드만.
**Pros:** 코드 단순화, 다크모드 스타일 버그 방지
**Cons:** 다크모드 사용자가 시스템 설정 무시됨
**Context:** `app/layout.tsx`의 `<ThemeProvider>` 수정
**Depends on:** 없음 (즉시 가능)
