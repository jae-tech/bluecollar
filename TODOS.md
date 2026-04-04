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

### TODO-022: LCP 이미지 loading="eager" 누락

**What:** `/worker/[slug]` 페이지의 포트폴리오 첫 번째 이미지(`/images/portfolio-3.jpg`)가 LCP 요소인데 `loading="eager"` 속성 없음.
**Why:** Next.js가 경고 발생. 페이지 로딩 성능(LCP) 저하 가능성.
**Context:** `apps/front/app/worker/[slug]/page.tsx` 또는 `ProjectCard` 컴포넌트 내 첫 번째 이미지에 `priority` prop 추가 (Next.js Image는 `priority`가 `loading="eager"` 역할).
**Effort:** S
**Priority:** P2
**Found by:** /qa on main, 2026-04-02

---

## 🎨 디자인 토큰 & UX (2026-04-04 /autoplan 발견)

### TODO-023: 온보딩 상태 표시 색상을 디자인 토큰으로 교체

**What:** `onboarding/slug/page.tsx`의 `bg-green-50/border-green-300/text-orange-600` 클래스를 디자인 시스템 토큰으로 교체.
**Why:** Raw Tailwind 색상이 다크모드에서 깨짐. DESIGN.md 토큰 계층 위반.
**Fix:** `bg-success/10 border-success text-success`, `bg-warning/10 text-warning` 패턴 사용 (DESIGN.md 참조).
**Effort:** S
**Priority:** P2
**Found by:** /autoplan Design Review, 2026-04-04

---

### TODO-024: 온보딩 radius 계층 정비

**What:** 온보딩 페이지 전반의 `rounded-xl` 일괄 사용을 DESIGN.md 계층(`rounded-sm` 입력/버튼, `rounded-md` 카드)으로 교체.
**Why:** 모든 요소가 동일 radius면 시각적 계층이 무너짐.
**Effort:** M
**Priority:** P3
**Found by:** /autoplan Design Review, 2026-04-04

---

### TODO-025: 온보딩 진행률 바 개선

**What:** `h-1` → `h-1.5`, 단계 레이블("2 / 4") 추가.
**Why:** 현재 진행률 바가 너무 얇고 몇 단계인지 알 수 없음.
**Effort:** S
**Priority:** P3
**Found by:** /autoplan Design Review, 2026-04-04

---

### TODO-026: "나중에" 재유도 — 워커 대시보드에 slug 설정 미완료 배너

**What:** slug가 없는 워커가 대시보드에 진입 시 slug 설정 재유도 배너 표시.
**Why:** "나중에" 버튼 제거로 slug 설정은 필수가 됐지만, 향후 탈출구가 필요할 경우를 위한 안전망.
**Effort:** S
**Priority:** P3
**Found by:** /autoplan Phase 3 Eng Review, 2026-04-04

---

### TODO-027: `step-5-username.tsx` 좀비 컴포넌트 제거

**What:** `apps/front/components/step-5-username.tsx` — mock 검증 로직이 있고 온보딩 플로우에 연결되지 않은 사용되지 않는 컴포넌트.
**Why:** 코드베이스 노이즈, 향후 혼란 방지.
**Effort:** XS
**Priority:** P3
**Found by:** /autoplan Design Review, 2026-04-04

---

### TODO-028: 클립보드 복사 폴백 (KakaoTalk/삼성 인터넷 인앱 브라우저)

**What:** `/onboarding/complete`의 링크 복사 버튼이 `navigator.clipboard` 미지원 환경에서 조용히 실패.
**Why:** KakaoTalk 인앱 브라우저, 삼성 인터넷 등에서는 Clipboard API가 제한됨.
**Fix:** `execCommand('copy')` 폴백 또는 "직접 복사하세요" toast 안내 UI 추가.
**Effort:** S
**Priority:** P2
**Found by:** /autoplan Design Review, 2026-04-04
