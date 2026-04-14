# BlueCollar CV — Design TODOs

Generated from `/plan-design-review` on 2026-03-30.
Updated from `/plan-eng-review` on 2026-03-31.
Updated from `/design-review` on 2026-03-31 (10 issues fixed, 8 deferred).
Updated from `/autoplan` on 2026-04-04 (eng review, 4 items added).

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

### ~~TODO-003: Hero floating badge 모바일 대응~~

**Fixed on main, 2026-03-31** (commit 614f2ad)

- floating badge에 `hidden sm:block` / `hidden sm:flex` 추가 — 375px 이하 모바일에서 숨김

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

### ~~TODO-005: 온보딩 완료 화면 (`/onboarding/complete`)~~

**Superseded by TODO-017 on main, 2026-04-01**

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

### ~~TODO-008: Navbar에서 '프로젝트 의뢰' 링크 제거~~

**Fixed on main, 2026-03-31** (commit 614f2ad)

- navbar 데스크톱/모바일 메뉴에서 '프로젝트 의뢰' 링크 제거

---

### ~~TODO-009: ThemeProvider를 라이트모드 전용으로 고정~~

**확인 완료, 2026-03-31** — `app/layout.tsx`에 ThemeProvider가 없음. 이미 라이트모드 고정 상태.

---

## 🔐 인증 시스템

### ~~TODO-010: Next.js middleware 라우트 보호~~

**Fixed on main, 2026-03-31** (commit 614f2ad)

- `apps/front/middleware.ts` 신규 추가
- `/onboarding`, `/dashboard` → 미인증 시 `/login?redirect=...` 리다이렉트
- `/login` → 인증 상태면 `/` 리다이렉트
- `/auth/*` 경로는 matcher에서 제외 (이메일 인증 페이지 접근 허용)

---

### ~~TODO-011: staging 환경 인증 코드 노출 방지~~

**Fixed on main, 2026-03-31**

- `email-verification.service.ts`: `NODE_ENV !== 'production'` → `EXPOSE_EMAIL_CODE === 'true'`
- `auth.service.ts`: SMS 코드도 동일하게 `EXPOSE_SMS_CODE === 'true'` 조건으로 변경
- 로컬 개발 시 `.env`에 `EXPOSE_EMAIL_CODE=true` 설정 필요, staging은 해당 변수 없이 운영

---

### ~~TODO-012: cleanupExpiredCodes() Cron 연결~~

**Fixed on main, 2026-03-31**

- `@nestjs/schedule` 패키지 설치
- `app.module.ts`에 `ScheduleModule.forRoot()` 추가
- `EmailVerificationService.cleanupExpiredCodes()`에 `@Cron(CronExpression.EVERY_DAY_AT_2AM)` 데코레이터 추가

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

---

## 🧭 온보딩 플로우 개선 (2026-04-01)

### ~~TODO-015: getRedirectPath 유틸 추출~~

**Fixed on main, 2026-04-01** — `apps/front/lib/redirect.ts` 신규 생성.

### TODO-015: getRedirectPath 유틸 추출

**What:** `workerProfile` 유무에 따라 리다이렉트 경로를 결정하는 로직을 공통 유틸로 추출.
**Why:** `verify-email/page.tsx`, `onboarding/slug/page.tsx` 등 여러 곳에 동일 분기 로직이 중복됨.
**Pros:** 중복 제거, 리다이렉트 정책 한 곳에서 관리
**Cons:** 없음
**Context:** `apps/front/lib/redirect.ts` 파일 신규 생성. `getRedirectPath(workerProfile: WorkerProfile | null): string` 형태. 프로필 있으면 `/worker/:slug`, 없으면 `/onboarding/slug`.
**Effort:** S
**Priority:** P2
**Depends on:** 온보딩 플로우 개선 PR (2026-04-01)

---

### ~~TODO-016: /onboarding/slug 신규 페이지~~

**Fixed on main, 2026-04-01** — `apps/front/app/onboarding/slug/page.tsx` 신규 생성. 실제 API slug 중복 확인, completeOnboarding 호출, 재방문자 가드.

### TODO-016: /onboarding/slug 신규 페이지

**What:** 이메일 인증 직후 slug만 설정하는 단독 페이지 (`apps/front/app/onboarding/slug/page.tsx`).
**Why:** 5단계 온보딩에서 slug가 마지막 → 이탈 전에 URL 확정 불가. slug 먼저 = 공유 동기 즉시 생성.
**Pros:** 이탈률 감소, URL 조기 확정
**Cons:** 없음
**Context:**

- 마운트 시 workerProfileId 있으면 `/worker/:slug` 리다이렉트 (재접근 가드)
- `GET /public/:slug` 재활용해 slug 중복 확인 (404=사용가능, 200=중복)
- 제출 시 `completeOnboarding(slug, slug, [])` → `/auth/refresh` → `/onboarding` 또는 `/worker/:slug`
- "나중에" 버튼: slug 설정 없이 `/worker/:slug`로 이동
- 409 응답 시 인라인 에러 표시
- `Step5Username` 컴포넌트 재활용, mock 중복 확인 → 실제 API로 교체
  **Effort:** M
  **Priority:** P1
  **Depends on:** 백엔드 `complete-onboarding.dto.ts` slug optional 변경

---

### ~~TODO-017: /onboarding/complete 축하 화면~~

**Fixed on main, 2026-04-01** — `apps/front/app/onboarding/complete/page.tsx` 신규 생성. 프로필 URL 복사 + "내 프로필 보기" CTA.

### TODO-017: /onboarding/complete 축하 화면

**What:** 4단계 온보딩 완료 후 축하 화면 (`apps/front/app/onboarding/complete/page.tsx`). TODO-005 대체.
**Why:** 온보딩 완료 모멘텀 포착, 공유 유도.
**Pros:** 활성화율 향상
**Cons:** 없음
**Context:** 프로필 URL 표시 + 복사 버튼 + "내 프로필 보기" CTA. KakaoTalk 공유는 별도 PR.
**Effort:** S
**Priority:** P1
**Depends on:** TODO-016

---

### ~~TODO-018: verify-email 인증 성공 → /onboarding/slug 리다이렉트~~

**Fixed on main, 2026-04-01** — `verify-email/page.tsx` 인증 성공 시 무조건 `/onboarding/slug`로 이동.

### TODO-018: verify-email 인증 성공 → /onboarding/slug 리다이렉트

**What:** `apps/front/app/auth/verify-email/page.tsx` 인증 성공 후 무조건 `/onboarding/slug`로 이동.
**Why:** 현재 `getMyWorkerProfile()` 분기 후 프로필 없으면 `/onboarding`으로 이동 → slug 페이지를 거치지 않음.
**Pros:** 신규 가입자 플로우 일관성
**Cons:** 없음
**Context:** slug 페이지에서 workerProfileId 있으면 `/worker/:slug` 리다이렉트하므로 재방문자도 안전.
**Effort:** S
**Priority:** P1
**Depends on:** TODO-016

---

### ~~TODO-019: onboarding/page.tsx slug 단계 제거 → 4단계~~

**Fixed on main, 2026-04-01** — Step5(slug) 제거, `TOTAL_STEPS` 5→4, `onboarding-data.ts` `OnboardingStep` 타입 축소, 완료 후 `/onboarding/complete`로 이동.

### TODO-019: onboarding/page.tsx slug 단계 제거 → 4단계

**What:** `apps/front/app/onboarding/page.tsx`에서 Step5(slug) 제거, `TOTAL_STEPS` 5→4.
**Why:** slug는 `/onboarding/slug`에서 이미 설정됨. 중복 노출 불필요.
**Pros:** 온보딩 단계 단축
**Cons:** 없음
**Context:** `completeOnboarding` 호출 시 slug 필드 제거. `businessName`은 slug 값 그대로 유지(백엔드가 기존 slug 보존).
**Effort:** S
**Priority:** P1
**Depends on:** TODO-016, 백엔드 slug optional 변경

---

### ~~TODO-020: worker/[slug]/page.tsx 미완성 프로필 배너~~

**Fixed on main, 2026-04-01** — `isOwner && specialties.length === 0` 조건으로 amber 배너 표시. "지금 완성하기" → `/onboarding`.

### TODO-020: worker/[slug]/page.tsx 미완성 프로필 배너

**What:** `fieldCodes`가 비어있을 때 "프로필을 완성하세요" 배너 표시.
**Why:** slug만 설정하고 4단계를 건너뛴 워커에게 완성 유도 필요.
**Pros:** 온보딩 완료율 향상
**Cons:** 없음
**Context:** 본인 프로필 조회 시에만 노출. "지금 완성하기" → `/onboarding` 이동.
**Effort:** S
**Priority:** P1
**Depends on:** TODO-019

---

## 🐛 QA 발견 버그 (2026-04-02)

### ~~TODO-021: "나중에" 버튼 — slug 미설정 상태로 /onboarding 진입 시 400 에러~~

**Fixed on main, 2026-04-04** — `/autoplan` Phase 3 Eng Review에서 발견, "나중에" 버튼 제거 (Fix 방향 B 채택). 백엔드가 slug를 필수로 강제하므로 스킵 자체가 불가능. `handleSkip` 함수와 버튼 제거, slug 확정 CTA만 유지.

**Original:** `/onboarding/slug`의 "나중에" 버튼이 slug를 설정하지 않고 `/onboarding`으로 이동. 이후 4단계 완료 시 `completeOnboarding` 호출에서 `slug: ""` (빈 문자열)가 전달돼 백엔드 400 에러 발생.

---

### ~~TODO-022: LCP 이미지 loading="eager" 누락~~

**확인 완료, 2026-04-15** — `apps/front/app/worker/[slug]/page.tsx:214,355`에 이미 `priority` prop 적용됨. 수정 불필요.

---

## 🎨 디자인 토큰 & UX (2026-04-04 /autoplan 발견)

### ~~TODO-023: 온보딩 상태 표시 색상을 디자인 토큰으로 교체~~

**Fixed on main, 2026-04-15**

- `onboarding/slug/page.tsx`: available → `bg-primary/10 border-primary/30`, error계열 → `bg-destructive/10 border-destructive/30`
- `text-orange-600/700` (invalid) → `text-destructive`
- `rounded-xl` → `rounded-md` (DESIGN.md radius 계층 준수)

---

### TODO-024: 온보딩 radius 계층 정비

**What:** 온보딩 페이지 전반의 `rounded-xl` 일괄 사용을 DESIGN.md 계층(`rounded-sm` 입력/버튼, `rounded-md` 카드)으로 교체.
**Why:** 모든 요소가 동일 radius면 시각적 계층이 무너짐.
**Effort:** M
**Priority:** P3
**Found by:** /autoplan Design Review, 2026-04-04

---

### ~~TODO-025: 온보딩 진행률 바 개선~~

**Fixed on main, 2026-04-15**

- `progress-bar.tsx`: `h-1` → `h-1.5`, 단계 레이블("2 / 4") 우측에 추가
- sticky 배경 `bg-background/95 backdrop-blur-sm`으로 변경, rounded-full 바 스타일

---

### TODO-026: "나중에" 재유도 — 워커 대시보드에 slug 설정 미완료 배너

**What:** slug가 없는 워커가 대시보드에 진입 시 slug 설정 재유도 배너 표시.
**Why:** "나중에" 버튼 제거로 slug 설정은 필수가 됐지만, 향후 탈출구가 필요할 경우를 위한 안전망.
**Effort:** S
**Priority:** P3
**Found by:** /autoplan Phase 3 Eng Review, 2026-04-04

---

### ~~TODO-027: `step-5-username.tsx` 좀비 컴포넌트 제거~~

**Fixed on main, 2026-04-15**

- `apps/front/components/onboarding/step-5-username.tsx` 삭제

---

### ~~TODO-028: 클립보드 복사 폴백 (KakaoTalk/삼성 인터넷 인앱 브라우저)~~

**Fixed on main, 2026-04-15**

- `onboarding/complete/page.tsx`: `navigator.clipboard` 미지원 시 textarea + `execCommand('copy')` 폴백 추가

---

## 🔧 Eng 품질 (autoplan Eng Review, 2026-04-04)

### ~~TODO-029: TOCTOU catch — pg 에러코드로 교체~~

**Fixed on main, 2026-04-15**

- `profile.service.ts:477`: `error.message.includes('unique')` → `(error as any).code === '23505'`

---

### ~~TODO-030: `areaCodes: []` 서비스 지역 미삭제 버그~~

**Fixed by /plan-eng-review on main, 2026-04-13**

- `profile.service.ts:430`: `if (areaCodes && areaCodes.length > 0)` → `if (areaCodes !== undefined)` + 내부에서 length 체크 분리
- 빈 배열 전달 시 기존 지역 전체 삭제 후 재삽입 없이 완료 (fieldCodes와 동일 패턴)

---

### ~~TODO-031: 온보딩 4단계 실패 시 slug 페이지로 redirect 누락~~

**Fixed on main, 2026-04-15**

- `onboarding/page.tsx` catch block에서 `ApiError && status === 400` 감지 시 `router.replace('/onboarding/slug')` 추가

---

### TODO-032: 프론트 `isValidFormat()` 단위 테스트 및 추출

**What:** `apps/front/app/onboarding/slug/page.tsx`의 `isValidFormat()` 함수가 백엔드 `validateSlug()`와 동일 로직이지만 테스트 없음.
**Why:** 백엔드 규칙 변경 시 프론트 복사본이 silent하게 불일치 발생.
**Fix:** `apps/front/lib/slug-format.ts`로 추출 후 `apps/front/lib/slug-format.test.ts` 작성.
**Effort:** S
**Priority:** P3
**Found by:** /autoplan Eng Review, 2026-04-04

---

## 📦 포트폴리오 스키마 확장 (portfolio-schema-expansion PR defer, 2026-04-09)

### ~~TODO-033: portfolios orderBy ASC 버그~~

**Fixed by /autoplan on main, 2026-04-13**

- `public.service.ts`: `.orderBy((t) => t.createdAt)` → `.orderBy(desc(portfolios.createdAt))`
- `desc` drizzle-orm import 추가

---

### TODO-034: warrantyMonths 검색 필터 API

**What:** `GET /portfolios?spaceType=RESIDENTIAL&minWarranty=12` 백엔드 API + 검색 페이지 필터 UI.
**Why:** warrantyMonths/spaceType/location 컬럼이 이번 PR에서 추가됨. 필터 API는 컬럼 데이터가 충분히 쌓인 후 구현.
**Effort:** M
**Priority:** P2
**Depends on:** portfolio-schema-expansion PR 머지 + 워커 데이터 축적
**Found by:** /plan-ceo-review, 2026-04-09

---

### TODO-035: location autocomplete (건물 API 연동)

**What:** 포트폴리오 작성 폼의 location 입력에 행안부/국토부 API autocomplete 연동.
**Why:** 현재 자유텍스트로 저장 — 지역 필터 정확도를 위해 정규화 필요.
**Effort:** L
**Priority:** P3
**Depends on:** TODO-034 (필터 API 먼저 구현)
**Found by:** /plan-ceo-review, 2026-04-09

---

## 🏠 랜딩 페이지 리디자인 후속 (autoplan CEO Review, 2026-04-13)

### TODO-036: 마퀴에 실제 포트폴리오 데이터 연결 (Hybrid ISR)

**What:** `PortfolioStrip`에 ISR 빌드타임 fetch 추가. `GET /public/portfolios` → top 8 최신 포트폴리오. 실제 데이터 없으면 현재 mock 배열 fallback.
**Why:** 현재 마퀴는 mock 이미지만 표시. 실제 워커가 늘어나면 신뢰도 위해 real data가 필요.
**Fix:** `portfolio-strip.tsx`에 `getStaticProps`(또는 RSC + `revalidate`) 추가. 빌드 시 `GET /public/portfolios` 호출. 0건이면 mock으로 대체.
**Effort:** M
**Priority:** P2
**Found by:** /autoplan CEO Review, 2026-04-13

---

### TODO-037: 히어로 섹션에 워커 수 소셜 프루프

**What:** `HeroSection`에 "현재 N명의 전문 기술자가 블루칼라에 있습니다" 카운트 표시.
**Why:** 신뢰 신호. 신규 방문 클라이언트가 "실제 서비스인지" 판단하는 핵심 지표.
**Fix:** `/public/stats` (또는 `/public/workers/count`) 엔드포인트 추가. ISR 또는 서버 컴포넌트로 빌드타임 주입. 0명이면 숨김.
**Effort:** S
**Priority:** P2
**Found by:** /autoplan CEO Review, 2026-04-13

---

### ~~TODO-038: JSON-LD 구조화 데이터 (Organization + WebSite)~~

**Fixed on main, 2026-04-15**

- `apps/front/app/layout.tsx` `<head>`에 `Organization` JSON-LD 스크립트 추가 (`name`, `url`, `description`)

---

### TODO-039: Canonical URL + subdomain SEO 전략

**What:** `bluecollar.cv`와 `slug.bluecollar.cv` 간 link equity 분산 방지 전략 수립.
**Why:** 서브도메인 방식은 각 서브도메인이 별도 도메인으로 취급됨 → `bluecollar.cv`의 SEO 신호가 `slug.bluecollar.cv`로 전파 안 됨. 반대도 마찬가지.
**Fix:** 옵션 A: `bluecollar.cv/w/[slug]` 경로 방식으로 전환. 옵션 B: 서브도메인 유지 + canonical 태그로 각 워커 페이지가 `bluecollar.cv`를 canonical로 지정.
**Note:** 아키텍처 결정 필요 — 팀과 논의 후 진행.
**Effort:** M~L (전략 방향에 따라)
**Priority:** P2
**Found by:** /autoplan CEO Review, 2026-04-13

---

### TODO-040: 랜딩 페이지 전환율 트래킹 (Analytics)

**What:** 랜딩 CTR 트래킹 — "지금 시작하기", "기술자 찾기", 마퀴 클릭 등 주요 이벤트 측정.
**Why:** 현재 analytics 없음 → 어떤 CTA가 전환을 만드는지 알 수 없음. A/B 테스트 전제 조건.
**Fix:** Google Analytics 4 또는 Plausible (GDPR friendly) 연동. 핵심 이벤트: `cta_click`, `signup_open`, `portfolio_view`.
**Effort:** M (analytics infra 설정 포함)
**Priority:** P2
**Depends on:** analytics 인프라 선택 결정
**Found by:** /autoplan CEO Review, 2026-04-13

---

### TODO-041: 클라이언트용 "기술자 찾기" CTA 추가

**What:** 랜딩 페이지에 클라이언트(발주자)를 위한 명시적 CTA 추가. "기술자를 찾고 계신가요?" 섹션 또는 히어로 서브헤드에 클라이언트 링크.
**Why:** 현재 랜딩 전체가 워커 리크루팅 중심 — 클라이언트가 도착하면 "이게 나를 위한 서비스인가?" 알 수 없음.
**Fix:** HeroSection 하단 또는 ClientCTA에 "시공업체 찾기" 방향 링크 추가. `/search` 또는 `/explore` (아직 없으면 disabled + "출시 예정" 뱃지).
**Effort:** S
**Priority:** P2
**Found by:** /autoplan CEO Review, 2026-04-13

---

### ~~TODO-042: roomId NULL 버그 — 포트폴리오 rooms 기능 비활성 (P1)~~

**Fixed by /autoplan on main, 2026-04-13**

- `create-portfolio.dto.ts`: media 항목에 `roomIndex?: number` 필드 추가
- `portfolio.service.ts` Step 5: `.returning({ id: portfolioRooms.id })`로 삽입된 room ID 캡처
- `portfolio.service.ts` Step 7: `roomIndex` 기반으로 `insertedRooms[mediaItem.roomIndex].id` 매핑
- `portfolio-form.tsx`: `rooms.flatMap((r, rIdx) => ...)` — `roomIndex: rIdx` 전달
- `api.ts`: `CreatePortfolioMediaPayloadWithRoom`에 `roomIndex?: number` 추가

---

### TODO-042-original (archived)

**What:** 모든 `portfolioMedia` 행의 `roomId`가 NULL. `portfolio.service.ts` Step 4에서 rooms를 insert하지만 `.returning()`으로 ID를 받아오지 않고, 프론트엔드도 roomId를 보내지 않음.
**Why:** 공간별 사진 그룹핑 기능 전체가 비동작. b86539b 커밋 이후 생성된 모든 포트폴리오가 영향받음.
**Fix:**
1. `CreatePortfolioMediaPayload`에 `roomIndex?: number` 필드 추가
2. 프론트: `rooms.flatMap((r, rIdx) => r.images.map(img => ({ ...img, roomIndex: rIdx })))`
3. 백: Step 4에 `.returning({ id: portfolioRooms.id })` 추가
4. 백: Step 5에서 `insertedRooms[mediaItem.roomIndex]?.id` → roomId 매핑
**Effort:** S (~2h 구현 + ~30min 테스트)
**Priority:** P1
**Found by:** /autoplan CEO + Eng Review, 2026-04-13

---

## 🔐 보안 (autoplan Eng Review, 2026-04-13)

### ~~TODO-043: IDOR — workerProfileId를 JWT subject에서 파생~~

**Fixed on main, 2026-04-15**

- `portfolio.controller.ts`: DTO의 `workerProfileId` 무시, `user.workerProfileId`(JWT)를 service에 직접 전달
- `portfolio.service.ts`: `createPortfolio(dto, callerWorkerProfileId)` 시그니처 추가, DTO 값 오버라이드
- `create-portfolio.dto.ts`: `workerProfileId` → optional (하위 호환 유지, 서버에서 JWT로 오버라이드됨)

---

## 🧩 디자인 시스템 컴플라이언스 (autoplan Design Review, 2026-04-13)

### ~~TODO-044: hero-section.tsx — tracking-tight 제거 (Critical DESIGN.md 위반)~~

**Fixed by /autoplan on main, 2026-04-13** — `hero-section.tsx:23`에서 `tracking-tight` 제거.

---

### TODO-044-original (archived)

**What:** `apps/front/components/hero-section.tsx:23` — 한글 헤드라인에 `tracking-tight` 클래스 사용.
**Why:** DESIGN.md 명시적 규칙: 한글에는 letter-spacing 클래스 사용 금지. 한글은 자간 조정이 가독성을 저해함.
**Fix:** `tracking-tight` 제거. 폰트 크기(`text-5xl md:text-6xl lg:text-7xl`)는 유지.
**Effort:** XS
**Priority:** P1 (DESIGN.md 위반)
**Found by:** /autoplan Design Review, 2026-04-13

---

### ~~TODO-045: how-it-works.tsx — tracking-tight 제거 (Critical DESIGN.md 위반)~~

**Fixed by /autoplan on main, 2026-04-13** — `how-it-works.tsx:26`에서 `tracking-tight` 제거.

---

### TODO-045-original (archived)

**What:** `apps/front/components/how-it-works.tsx:27` — 한글 h2에 `tracking-tight` 클래스 사용.
**Why:** TODO-044와 동일.
**Fix:** `tracking-tight` 제거.
**Effort:** XS
**Priority:** P1 (DESIGN.md 위반)
**Found by:** /autoplan Design Review, 2026-04-13

---

### ~~TODO-046: client-cta.tsx — 텍스트 대비 WCAG AA 수정~~

**Fixed on main, 2026-04-15**

- `client-cta.tsx`: `text-primary-foreground/50` → `/70`, `text-primary-foreground/40` → `/70`, `border-primary-foreground/15` → `/30`

---

### ~~TODO-047: client-cta.tsx — max-w-4xl → max-w-3xl (DESIGN.md 768px 제한)~~

**Fixed on main, 2026-04-15**

- `client-cta.tsx:13`: `max-w-4xl` → `max-w-3xl`

---

### ~~TODO-048: portfolio-strip.tsx — bg-foreground/60 토큰 수정~~

**Fixed on main, 2026-04-15**

- `portfolio-strip.tsx:47`: `bg-foreground/60 text-primary-foreground` → `bg-neutral-800/70 text-white`

---

### ~~TODO-049: hero-section.tsx, how-it-works.tsx — badge rounded → rounded-sm~~

**Fixed on main, 2026-04-15**

- `hero-section.tsx:18`, `how-it-works.tsx:49`: `rounded` → `rounded-sm`

---

## 🔢 Eng 품질 — rooms 스프린트 (autoplan Eng Review, 2026-04-13)

### ~~TODO-050: RoomType enum — frontend 로컬 타입 → @repo/constants에서 import~~

**Fixed on main, 2026-04-15**

- `packages/constants/src/room-types.ts` 신규 생성 (9개 enum 값 — ENTRANCE, UTILITY, STUDY 포함)
- `packages/constants/src/index.ts`에 re-export 추가
- `portfolio-form.tsx`: 로컬 `RoomType` 타입 제거, `@repo/constants`에서 `ROOM_TYPE_VALUES`, `RoomType` import
- `ROOM_TYPE_LABELS`에 ENTRANCE/UTILITY/STUDY 한글 레이블 추가

---

### ~~TODO-051: 서버사이드 media 수량 제한 추가~~

**Fixed on main, 2026-04-15**

- `portfolio.service.ts`: `MAX_TOTAL_MEDIA = 50`, `MAX_MEDIA_PER_ROOM = 10` 가드 추가 (트랜잭션 시작 전 검증)
