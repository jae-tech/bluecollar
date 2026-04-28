# BlueCollar CV

블루칼라 전문가(타일, 도배, 전기, 배관 등)를 위한 디지털 포트폴리오 플랫폼.

시공 사례를 업로드하면 개인 URL(`slug.bluecollar.cv`)이 생성됩니다. 명함 대신 링크 하나로 전문성을 증명할 수 있습니다.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| Backend | NestJS 11, Fastify, Drizzle ORM, PostgreSQL 16 |
| Auth | JWT (Access/Refresh), Email 인증, Google/Kakao OAuth |
| Infra | Turborepo, pnpm, Docker Compose |
| Deploy | Cloudflare Workers (Front), Node.js 22 (API) |

---

## Project Structure

```
bluecollar/
├── apps/
│   ├── api/          # NestJS REST API
│   └── front/        # Next.js 프론트엔드
├── packages/
│   └── database/     # Drizzle 스키마 + 마이그레이션
├── docker-compose.yml
└── turbo.json
```

### API 도메인 구조

```
apps/api/src/domains/
├── auth/       # 이메일/SMS 인증, OAuth, JWT 토큰 관리
├── profile/    # 워커 프로필 생성·수정, 온보딩
├── portfolio/  # 작업 사례 CRUD, 미디어 첨부
├── upload/     # 이미지 WebP 변환 (Sharp), 파일 저장
└── public/     # 인증 없이 접근 가능한 공개 프로필 조회
```

---

## Getting Started

**사전 요구사항:** Node.js 22+, pnpm 10+, Docker

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.development
# .env.development 필수 값 입력

# DB 초기화 + 서버 시작
pnpm dev:init   # PostgreSQL 컨테이너 → 마이그레이션 → 시드
pnpm dev        # API :4000, Front :3000
```

**개발 환경 접속:**
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Front: `http://localhost:3000`

---

## Key Commands

```bash
# 개발
pnpm dev              # 전체 개발 서버 (turbo)
pnpm build            # 전체 빌드
pnpm lint             # ESLint
pnpm format           # Prettier

# DB
pnpm dev:init         # 최초 설정 (컨테이너 → 마이그레이션 → 시드)
pnpm db:down          # 컨테이너 종료
cd packages/database
pnpm db:generate      # 마이그레이션 파일 생성
pnpm db:push          # 스키마 반영

# 테스트 (apps/api)
pnpm test             # Vitest 유닛 테스트
pnpm test:e2e         # Supertest E2E 테스트
pnpm test:cov         # 커버리지 리포트

# 프론트 Cloudflare 배포
cd apps/front
pnpm build:cf         # OpenNext → Cloudflare Workers 빌드
pnpm preview          # 로컬 Workers 미리보기
```

---

## Environment Variables

```bash
# apps/api/.env.development

NODE_ENV=development
DATABASE_URL=postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev

# JWT
JWT_SECRET=                        # 32자 이상 랜덤 문자열
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# 이메일 (Zoho Mail SMTP)
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USER=hello@bluecollar.cv
EMAIL_PASSWORD=
EMAIL_FROM=hello@bluecollar.cv

# 개발 환경 인증 코드 노출 (응답 바디에 코드 포함)
EXPOSE_EMAIL_CODE=true
EXPOSE_SMS_CODE=true

# OAuth (선택)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Slack 에러 알림 (선택)
SLACK_WEBHOOK_URL=

# apps/front/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Architecture Notes

**인증 흐름**
1. 이메일 회원가입 → 인증 코드 발송 → 코드 확인 → JWT 발급
2. Access Token 15분 / Refresh Token 30일 (DB 저장, httpOnly 쿠키)
3. 미들웨어(`middleware.ts`)에서 쿠키 존재 여부로 1차 라우트 보호

**서브도메인 라우팅**
- `slug.bluecollar.cv` → `bluecollar.cv/worker/slug` 투명 rewrite (URL 변경 없음)
- `wrangler.toml` `*.bluecollar.cv` 와일드카드 라우트 + Cloudflare DNS Proxied 레코드 필요
- 쿠키 도메인 `.bluecollar.cv` — apex + 모든 서브도메인에서 인증 공유

**이미지 처리**
- Sharp로 WebP 변환 (품질 85%), 최대 2560×1920
- 업로드 실패 시 임시 파일 자동 삭제

**성능**
- 포트폴리오 미디어 조회: N+1 → `inArray` 배치 조회 (쿼리 81% 감소)
- 조회수 증가: `sql` 템플릿 Atomic increment (race condition 방지)

**배포**
- Front: GitHub Actions → OpenNext 빌드 → Cloudflare Workers 자동 배포
- API: Node.js 서버 (별도 배포)

---

## API Overview

```
# Auth
POST  /auth/email/signup       # 회원가입
POST  /auth/email/send-code    # 인증 코드 발송
POST  /auth/email/verify       # 인증 코드 확인
POST  /auth/email/login        # 로그인
POST  /auth/refresh            # 토큰 갱신
POST  /auth/logout

# Profile
POST  /workers/onboarding      # 온보딩 완료 (프로필 생성)
GET   /workers/me
PATCH /workers/profile/:id
PATCH /workers/profile/:id/info

# Portfolio
POST   /portfolios
GET    /portfolios
PATCH  /portfolios/:id
DELETE /portfolios/:id
POST   /portfolios/:id/media
DELETE /portfolios/:id/media/:mediaId

# Public (인증 불필요)
GET   /public/:slug            # 공개 프로필 조회
```

전체 스펙: `http://localhost:4000/docs` (Swagger UI)
