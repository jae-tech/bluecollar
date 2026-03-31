# BlueCollar CV — Design TODOs

Generated from `/plan-design-review` on 2026-03-30.
Updated from `/plan-eng-review` on 2026-03-31.
Updated from `/design-review` on 2026-03-31 (10 issues fixed, 8 deferred).

---

## 🎨 브랜드 & 디자인 시스템

### ~~TODO-001: 오렌지 브랜드 컬러를 CSS 변수로 정의~~

**Fixed by /design-review on main, 2026-03-31** (commit 1f94fb3)

- `globals.css`에 `--brand: oklch(0.65 0.20 40)` 추가 (라이트/다크 모두)
- `hero-section.tsx`, `signup-modal.tsx`에서 `#FF6B00` → `currentColor + text-brand`

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

---

## 🔐 인증 시스템

### TODO-010: Next.js middleware 라우트 보호

**What:** `apps/front/middleware.ts` 추가. `/onboarding`, `/dashboard` 등 인증 필요 페이지에서 쿠키 없으면 `/login` 리다이렉트. `/login` 페이지에서 쿠키 있으면 `/worker/{slug}` 또는 `/onboarding` 리다이렉트.
**Why:** 로그인 안 한 유저가 온보딩을 완료해도 JWT가 없어 API 호출이 401로 실패함. 유저는 저장이 안 된 줄 모름.
**Pros:** 잘못된 상태 진입 방지, 깔끔한 UX
**Cons:** httpOnly 쿠키는 middleware에서 accessToken 유효성 검증 불가 (쿠키 존재 여부만 체크 가능)
**Context:** 쿠키 존재 여부만으로 1차 가드. 실제 유효성은 API 호출 시 401로 확인. `/auth/verify-email`은 보호 불필요 (미인증 유저 전용).
**Effort:** S
**Priority:** P2
**Depends on:** 인증 시스템 완료 (이번 사이클)

---

### TODO-011: staging 환경 인증 코드 노출 방지

**What:** `NODE_ENV !== 'production'` 조건 대신 별도 환경변수(`EXPOSE_EMAIL_CODE=true`)로 코드 응답 포함 여부를 제어. 이메일 발송 인프라 구축 후 완전 제거.
**Why:** staging이 `NODE_ENV=production`으로 설정되지 않으면 인증 코드가 API 응답에 포함됨 — 보안 위협.
**Pros:** staging 보안 강화, 이메일 발송 없는 로컬 개발도 명시적으로 허용
**Cons:** 환경변수 추가 관리 필요
**Context:** `auth.service.ts`, `email-verification.service.ts`의 `NODE_ENV` 체크 위치 수정.
**Effort:** S
**Priority:** P2
**Depends on:** 없음

---

### TODO-012: cleanupExpiredCodes() Cron 연결

**What:** `EmailVerificationService.cleanupExpiredCodes()`를 `@nestjs/schedule`의 `@Cron(CronExpression.EVERY_DAY_AT_2AM)`으로 스케줄링.
**Why:** 인증 완료된 코드와 만료된 코드가 `emailVerificationCodes` 테이블에 무한정 쌓임. 서비스 규모에 따라 성능 저하 가능.
**Pros:** 테이블 크기 관리, 쿼리 성능 유지
**Cons:** `@nestjs/schedule` 패키지 추가 필요
**Context:** `EmailVerificationService`에 `@Cron` 데코레이터 추가 또는 별도 `CleanupService` 생성. 현재 메서드는 완성된 상태.
**Effort:** S
**Priority:** P3
**Depends on:** 없음

---

## 🔌 API 연동 준비 (워커 프로필 페이지)

### TODO-013: InquiryForm mock submit → 실제 API 연동

**What:** `apps/front/components/inquiry-form.tsx`의 `handleSubmit`이 현재 setTimeout mock 처리.
**Why:** 사용자가 문의 폼을 제출해도 실제로 아무 데이터도 저장되지 않음. API 연동 PR 때 반드시 처리.
**Pros:** 실제 문의 데이터 수신 가능, 워커에게 알림 발송 가능
**Cons:** 백엔드 `/inquiries` 엔드포인트 설계 필요
**Context:** `handleSubmit` 함수 내 `// TODO: POST /inquiries API 연동 필요 — 현재 mock 처리` 코멘트 참조. 성공 시 토스트 메시지는 이미 구현됨.
**Effort:** M
**Priority:** P1
**Depends on:** API 연동 PR (20260330 디자인 문서)

### TODO-014: /worker/[slug] 동적 라우트에 notFound() 처리 추가

**What:** `apps/front/app/worker/[slug]/page.tsx`에 slug 기반 DB 조회 후 없으면 `notFound()` 호출.
**Why:** 현재 어떤 slug든 WORKER_CONFIG를 반환함. API 연동 후 존재하지 않는 워커 URL은 404여야 함.
**Pros:** 올바른 SEO, 사용자에게 명확한 오류 페이지
**Cons:** 없음
**Context:** API 연동 시 `fetchWorkerConfig(slug)` 함수가 null 반환할 경우 `import { notFound } from 'next/navigation'` 후 `notFound()` 호출.
**Effort:** S
**Priority:** P1
**Depends on:** API 연동 PR (20260330 디자인 문서)
