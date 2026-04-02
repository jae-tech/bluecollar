# Changelog

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
