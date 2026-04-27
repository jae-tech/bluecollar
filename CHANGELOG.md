# Changelog

## [0.2.1.0] - 2026-04-27

### Added

- 커스텀 DatePicker 컴포넌트 — react-day-picker 기반, DESIGN.md 토큰 적용, minDate/maxDate 지원
- 포트폴리오 등록 폼에 DatePicker 연동 — 날짜 필드 UX 개선

### Changed

- admin 로그인 성공 시 /admin으로 직행 (기존 홈 → /admin 리다이렉트 제거)
- 대시보드 프로필 링크 — 서브도메인 URL (worker.bluecollar.cv/{slug}) 적용

### Fixed

- 유니코드 이스케이프(\uXXXX) → 실제 한글 문자열로 변환 (가독성 개선)
- AdminInboxService ConfigService 주입 방어 — 테스트 환경 DI 안전성 확보
- test/setup.ts .env.test 우선 로드 — ConfigModule 테스트 환경 변수 인식
- DESIGN.md 계층 위반 수정 — shadow 제거, 버튼·입력 radius rounded-sm 통일, text-gray-500 → text-muted-foreground
- DatePicker useMemo/useCallback 추가 — 불필요한 리렌더링 방지

## [0.2.0.0] - 2026-04-21

### Added

- 포트폴리오 모달 딥링크 — `?portfolio=[id]` URL로 직접 접근 시 자동 오픈, 브라우저 뒤로가기로 닫기
- 포트폴리오 모달 키보드 네비게이션 — ArrowLeft/Right로 이미지 이동
- 포트폴리오 모달 모바일 스와이프 제스처 — 50px 임계값 touchstart/touchend
- 워커 검색 API 연결 — 키워드·업종·지역·경력·인증 필터, 검색 결과 카드 렌더링
- 의뢰 폼 실 API 연결 — POST /public/profiles/:slug/inquiry 연동 (Zod 입력 검증 포함)
- 포트폴리오 모달에서 워커 프로필 전체보기 링크 추가
- 프론트엔드 Vitest 설정 + FIELD_CODE_LABELS 단위 테스트 추가

### Changed

- 포트폴리오 모달 공간 갤러리 — RoomTabGallery → RoomScrollGallery (수직 스크롤 + sticky 탭)
- 포트폴리오 모달 비용 표시 — 단일 cost → 예상(estDisplay) / 실제(actDisplay) 분리
- overflow lock — CSS attribute selector 방식 → JS inline style 직접 설정 (Turbopack 호환)
- searchWorkers 포트폴리오 조회 — 무제한 → limit * 3 가드로 DB 부하 제한

### Fixed

- useMemo Rules of Hooks 위반 수정 — early return 이전으로 이동 (딥링크 앱 크래시 해결)
- 포트폴리오 태그 렌더링 버그 수정 — API 반환 타입 `string[]` 불일치로 태그 텍스트 미표시
- 워커 프로필 업종 뱃지 한국어 미표시 수정 — 잘못된 FIELD_LABEL 맵 → field-codes.ts 임포트
- 온보딩 3단계 다음 버튼 — 스킬 미선택 시 비활성화 로직 수정
- 업종 코드 배지 한국어 표시 수정 — FLD_* raw enum 대신 FIELD_CODE_LABELS 사용
- parseInt NaN 가드 추가 — 검색 limit 파라미터 잘못된 입력 시 빈 결과 반환 버그
- O(n²) → O(n): profileIds.includes() → Set.has() 로 검색 결과 조립 최적화
- 검색 페이지 dead state 제거 — inquiryFormOpen / 구 stub InquiryForm import

## [0.1.0.0] - 2026-04-16

### Added

- 포트폴리오 모달 공간별 사진 갤러리 — 수평 탭 + 이미지 캐러셀 (RoomTabGallery)
- 포트폴리오 모달 시공 전/후 탭 분리 — BeforeAfterTabs 컴포넌트, 기본 "시공 후" 선택
- 포트폴리오 모달 데스크탑 2컬럼 레이아웃 — 왼쪽 이미지(3fr) / 오른쪽 상세정보(2fr)
- 포트폴리오 상세 정보 확장 — 공간 유형, 위치, 면적, 시공 기간, 난이도, 비용, 태그, 보증, 시공 범위
- 대시보드 포트폴리오 미리보기 모달 — 카드 클릭 시 고객 시점(mode="edit") 즉시 확인
- 서버사이드 미디어 수량 검증 — 포트폴리오당 최대 50개, 공간당 최대 10개 (TODO-051)
- 랜딩 페이지 실 데이터 연결 — 워커 수, 포트폴리오 수 API 연동

### Fixed

- IDOR 취약점 수정 — workerProfileId를 DTO 대신 JWT에서 파생 (TODO-043)
- updatePortfolio roomIndex→roomId 매핑 누락 수정 — rooms 미변경 시 기존 rooms 로드로 매핑 유지
- updatePortfolio per-room 미디어 수량 검증 누락 수정 — createPortfolio와 동일 기준 적용
- formatCost(0) "0만원" 표시 버그 수정 — 0 이하는 null 반환
- tel: href 정규식 강화 — 최소 1개 숫자 필수로 순수 특수문자 방어
- RoomTabGallery portfolio 전환 시 activeIdx 초기화 — key prop으로 언마운트 보장
- navbar useLayoutEffect → useEffect 복귀 (SSR 경고 제거)
- 미들웨어 토큰 판단 개선 — accessToken 대신 refreshToken 기준으로 인증 판단
- 온보딩 UX 개선 (TODO-023/025/027/028/029)

### Design

- 한국어 텍스트 tracking-wider 제거 — 영문 전용 스타일 미적용
- 태그 뱃지 색상 토큰 수정 — primary 오렌지 → accent/border (CTA 전용 원칙)

## [0.1.3] - 2026-04-08

### Features

- 서브도메인 라우팅 — `slug.bluecollar.cv`로 워커 프로필에 직접 접근 가능 (middleware.ts rewrite)
- `wrangler.toml` 와일드카드 라우트 추가 — `*.bluecollar.cv` 요청을 동일 Cloudflare Worker로 처리
- 대시보드에 워커 검색 링크 추가 (header nav)
- 포트폴리오 상세 모달 — 이미지 타입별(BEFORE/AFTER/DETAIL) 탭, 전화 연결 CTA
- 워커 프로필 공유 기능 — `navigator.share` API + 클립보드 복사 폴백, 토스트 알림

### Bug Fixes

- CORS origin 정규식 수정 — apex 도메인(`bluecollar.cv`) 누락 버그 수정
- 쿠키 도메인 설정 — 모든 `setCookie` 호출에 `domain: '.bluecollar.cv'` 추가 (서브도메인 간 쿠키 공유)

### Changes

- `lib/api.ts` 공개 프로필 조회 및 내 워커 프로필 조회 API 함수 추가

## [0.1.2] - 2026-04-04

### Features

- Slug 강화: 첫 글자 숫자 금지 규칙 추가 (`1abc` → invalid)
- `@repo/constants` 신규 패키지 — `RESERVED_SLUGS` + `isSlugReserved()` 단일 소스 (프론트/백엔드 동기화)
- `public.service.ts:checkSlugAvailability` — 포맷 검증 + 예약어 체크를 `validateSlug()`로 통합 (이전: 예약어만 체크, `1abc` → available 오신호 버그 수정)
- 예약어 확장: `worker`, `onboarding`, `dashboard`, `settings`, `profile`, `billing`, `null`, `undefined`, `true`, `false`, `nan` 추가

### Bug Fixes

- 온보딩 slug 페이지 & complete 페이지 guard `useEffect`에 `.catch()` 추가 — API 오류 시 무한 스피너 버그 수정
- "나중에" skip 버튼 제거 — 백엔드가 `slug` 필수 강제, 스킵 시 unrecoverable 400 루프 버그 수정
- slug 가용성 확인 오류 상태 (`error`) 추가 — 네트워크 오류 시 silently swallow 버그 수정
- `login/page.tsx` slug 미설정 시 `/onboarding` → `/onboarding/slug`로 리다이렉트 수정 (undefined slug 방지)
- `onboarding/complete/page.tsx` `!p` → `!p?.slug` 가드 수정 (/worker/undefined 버그 수정)
- `onboarding/page.tsx` `text-red-500` → `text-destructive` 디자인 토큰 수정
- `signup-modal.tsx` 비밀번호 placeholder 복사 오류 수정 ("8자 이상, 대/소문자 포함" → "8자 이상")

### Changes

- 온보딩 데스크탑 반응형: `max-w-lg mx-auto` centering, fixed 하단 버튼 inner wrapper
- `onboarding/complete/page.tsx` `max-w-md` → `max-w-lg` 컨테이너 너비 통일
- 비밀번호 정책 완화: 대문자 `.regex()` 제거 (백엔드 DTO + 프론트 검증)
- `complete-onboarding.dto.ts` Zod regex 복사본 제거 → `superRefine(validateSlug)` 중앙화

### Tests

- `slug.validator.spec.ts` 24개 유닛 테스트 추가 (예약어, 포맷, 숫자 시작 금지 등)
- Vitest `@repo/constants` alias 추가 — 모노레포 raw TS 패키지 모듈 해석 문제 해결

## [0.1.1] - 2026-04-02

### Features

- 온보딩 플로우 개선 — 회원가입 직후 slug 선행 설정 (Approach C)
  - `/onboarding/slug` 페이지 신설: 회원가입 직후 slug를 먼저 선택
  - `completeOnboarding` DTO: `slug` 선택적 허용, `fieldCodes` 빈 배열 허용
  - 기존 프로필 재온보딩 시 `slug` 미제공이면 기존 slug 유지

### Bug Fixes

- JWT 쿠키 인증 및 로그인 플로우 버그 수정
  - JWT 전략에서 쿠키 기반 토큰 추출 로직 개선
  - OAuth 콜백 시 `workerProfileId` 유무에 따른 리다이렉트 분기 추가
- `worker/[slug]` 배너 `isOwner` 판단 로직 수정 — URL params 기반으로 변경
- slug DB 유니크 제약 위반 시 500 → 409 ConflictException으로 변환 (TOCTOU 경쟁 조건 처리)
- `CompleteOnboardingPayload.slug` 타입 `string` → `string?` 수정 (프론트-백엔드 타입 일치)

### Tests

- `completeOnboarding` 메서드 커버리지 추가 (5개 케이스)
- `EXPOSE_SMS_CODE` 환경변수 설정 누락으로 인한 유닛 테스트 실패 수정

### Chore

- deploy 설정 추가 (Cloudflare Workers, `setup-deploy`)
- API v0.0.1 → v0.0.2, Front v0.1.0 → v0.1.1

## [0.1.0] - 초기 릴리즈

- NestJS (Fastify) + Next.js 14 모노레포 초기 구성
- 워커 회원가입 / SMS 인증 / JWT 인증 플로우
- 워커 프로필 (전문 분야, 활동 지역, 포트폴리오)
- Cloudflare Workers 프론트엔드 배포
