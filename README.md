# 🔧 BlueCollar - 블루칼라 전문가 포트폴리오 플랫폼

> 타일, 도배, 전기, 배관 등 블루칼라 전문가들을 위한 포트폴리오 공유 플랫폼

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [환경 변수](#-환경-변수)
- [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 소개

### 목적

BlueCollar는 **블루칼라 전문가들이 자신의 작업 사례를 체계적으로 관리하고 공유**할 수 있도록 돕는 포트폴리오 플랫폼입니다.

전통적으로 건설·인테리어 업계의 전문가들은 자신의 작업 실적을 보여주기 어려웠습니다. 명함이나 사진 몇 장으로는 전문성을 제대로 전달하기 힘들고, SNS는 체계적인 관리가 어렵습니다.

BlueCollar는 이 문제를 해결하기 위해:

- ✅ **개인화된 포트폴리오 페이지** (`slug.bluecollar.cv`) 제공
- ✅ **시공 전/후 사진, 영상, 견적서**를 체계적으로 관리
- ✅ **사업자 검증**을 통한 신뢰도 확보
- ✅ **공개 프로필**로 고객에게 쉽게 공유

### 목표

1. **전문가의 포트폴리오 관리 간소화**
   - 웹 기반으로 언제 어디서나 포트폴리오 업데이트
   - 이미지, 영상, PDF 파일을 자동으로 최적화하여 저장

2. **고객과의 신뢰 구축**
   - 사업자 등록증 검증 시스템
   - 실제 작업 사례 기반의 투명한 정보 제공

3. **효율적인 매칭**
   - 지역별, 분야별 전문가 검색
   - 실제 작업 난이도와 비용 정보 제공

4. **확장 가능한 플랫폼**
   - 향후 견적 요청, 리뷰 시스템, 결제 기능 추가 가능한 설계

---

## ✨ 주요 기능

### 1. 워커 프로필 관리

- 🔗 **개인 도메인**: `{slug}.bluecollar.cv` 형태의 개인 페이지
- 👤 **프로필 정보**: 상호명, 경력, 전문 분야, 활동 지역
- 📸 **프로필 이미지**: 사업장 사진, 대표 이미지
- ✅ **사업자 검증**: 사업자 등록증 업로드 및 관리자 승인

### 2. 포트폴리오 작성

- 📂 **작업 사례 관리**: 제목, 내용, 작업 기간
- 🖼️ **미디어 첨부**:
  - 시공 전/후/진행 중 이미지 (자동 WebP 변환)
  - 작업 과정 영상 (MP4, WebM)
  - 견적서/명세서 PDF
- 💰 **비용 정보**: 예상 비용, 실제 비용 (공개/비공개 선택)
- 🏷️ **난이도 표시**: 작업 난이도 (상/중/하)

### 3. 인증 시스템

- 📧 **이메일 인증**: UUID 기반 인증 코드 (24시간 유효)
- 📱 **SMS 인증**: 휴대폰 번호 인증
- 🌐 **OAuth 로그인**: Google, Kakao 소셜 로그인
- 🔐 **JWT 토큰**:
  - Access Token (15분 유효)
  - Refresh Token (30일 유효, DB 저장)

### 4. 파일 업로드

- 📤 **이미지 최적화**:
  - 최대 해상도 2560x1920
  - WebP 변환 (품질 85%, 평균 70% 용량 절감)
  - 메타데이터 자동 제거
- 🎥 **동영상 지원**: MP4, WebM (최대 50MB)
- 📄 **문서 지원**: PDF (최대 50MB)
- 🗑️ **자동 정리**: 업로드 실패 시 임시 파일 자동 삭제

### 5. 공개 프로필 조회

- 🌐 **토큰 없이 접근 가능**: 누구나 공개 프로필 조회
- 🔍 **SEO 최적화**: Slug 기반 URL
- 📊 **조회수 추적**: 포트폴리오별 조회수 통계
- ⚡ **성능 최적화**: N+1 쿼리 제거, Atomic increment

### 6. 에러 모니터링

- 🔔 **Slack 알림**: 500+ 에러 발생 시 자동 알림
- 🔇 **중복 방지**: 1분 내 동일 에러는 첫 번째만 알림
- 🎨 **아름다운 포매팅**: Slack Block Kit 사용

---

## 🛠️ 기술 스택

### Backend

- **Framework**: [NestJS](https://nestjs.com/) 10.x (Fastify Adapter)
- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.9
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL 16
- **Validation**: Zod (nestjs-zod)
- **Authentication**: Passport.js (JWT, Google OAuth, Kakao OAuth)
- **File Upload**: @fastify/multipart, Sharp (이미지 최적화)
- **Email**: Nodemailer (Zoho Mail SMTP)
- **Logging**: nestjs-pino (Pino + pino-pretty)
- **Testing**: Vitest

### Infrastructure

- **Monorepo**: [Turborepo](https://turbo.build/)
- **Package Manager**: pnpm 10.x
- **Container**: Docker, Docker Compose
- **API Documentation**: Swagger (OpenAPI 3.0)

### External Services

- **Email**: Zoho Mail
- **Monitoring**: Slack Webhook
- **OAuth**: Google OAuth 2.0, Kakao OAuth

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 22 이상
- pnpm 10 이상
- Docker & Docker Compose
- PostgreSQL 16 (Docker Compose로 자동 설치)

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/bluecollar.git
cd bluecollar

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.development
# .env.development 파일을 열어서 필수 환경 변수 입력

# 4. 데이터베이스 및 초기 데이터 설정
pnpm dev:init
# 이 명령어는 다음을 자동으로 실행합니다:
# - 빌드 (pnpm build)
# - Docker Compose로 PostgreSQL 시작
# - 데이터베이스 연결 대기
# - 마이그레이션 실행 (db:push)
# - 초기 데이터 삽입 (db:seed)

# 5. 개발 서버 시작
pnpm dev
```

### 개발 서버 접속

- **API Server**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/docs

---

## 📁 프로젝트 구조

```
bluecollar/
├── apps/
│   └── api/                      # NestJS API 애플리케이션
│       ├── src/
│       │   ├── common/           # 공통 모듈
│       │   │   ├── filters/      # 전역 예외 필터
│       │   │   ├── guards/       # 인증/권한 가드
│       │   │   ├── services/     # 공통 서비스
│       │   │   └── types/        # 공통 타입 정의
│       │   ├── domains/          # 비즈니스 도메인
│       │   │   ├── auth/         # 인증 (이메일, SMS, OAuth)
│       │   │   ├── portfolio/    # 포트폴리오 관리
│       │   │   ├── profile/      # 워커 프로필 관리
│       │   │   ├── public/       # 공개 프로필 조회
│       │   │   └── upload/       # 파일 업로드
│       │   ├── infrastructure/   # 인프라 계층
│       │   │   ├── database/     # Drizzle ORM 설정
│       │   │   ├── email/        # 이메일 서비스
│       │   │   ├── sms/          # SMS 서비스
│       │   │   └── slack/        # Slack 알림
│       │   ├── app.module.ts     # 루트 모듈
│       │   └── main.ts           # 애플리케이션 진입점
│       ├── test/                 # E2E 테스트
│       └── package.json
├── packages/
│   └── database/                 # 공유 데이터베이스 패키지
│       ├── src/
│       │   ├── schema.ts         # Drizzle 스키마 정의
│       │   └── scripts/
│       │       └── seed.ts       # 초기 데이터 삽입
│       ├── drizzle/              # 마이그레이션 파일
│       └── package.json
├── docker-compose.yml            # PostgreSQL 컨테이너 설정
├── turbo.json                    # Turborepo 설정
└── package.json                  # 루트 package.json
```

### 도메인별 역할

| 도메인        | 설명             | 주요 기능                              |
| ------------- | ---------------- | -------------------------------------- |
| **auth**      | 인증 및 회원가입 | 이메일/SMS 인증, OAuth, JWT 토큰 관리  |
| **profile**   | 워커 프로필 관리 | 프로필 생성/수정, 전문 분야/지역 설정  |
| **portfolio** | 포트폴리오 관리  | 작업 사례 작성, 미디어 첨부, 비용 관리 |
| **upload**    | 파일 업로드      | 이미지 최적화, 파일 저장, 삭제         |
| **public**    | 공개 프로필 조회 | Slug 기반 프로필 조회, 조회수 증가     |

---

## 📚 API 문서

### Swagger UI

개발 서버 실행 후 http://localhost:4000/docs 에서 전체 API 명세를 확인할 수 있습니다.

### 주요 API 엔드포인트

#### 인증 (Auth)

```
POST   /auth/email/signup          # 이메일 회원가입
POST   /auth/email/send-code       # 이메일 인증 코드 발송
POST   /auth/email/verify          # 이메일 인증 코드 확인
POST   /auth/email/login           # 이메일 로그인
POST   /auth/sms/send-code         # SMS 인증 코드 발송
POST   /auth/sms/verify            # SMS 인증 코드 확인
GET    /auth/google                # Google OAuth 시작
GET    /auth/google/callback       # Google OAuth 콜백
GET    /auth/kakao                 # Kakao OAuth 시작
GET    /auth/kakao/callback        # Kakao OAuth 콜백
POST   /auth/refresh               # 토큰 갱신
POST   /auth/logout                # 로그아웃
```

#### 프로필 (Profile)

```
POST   /profile                    # 프로필 생성
GET    /profile/me                 # 내 프로필 조회
PATCH  /profile                    # 프로필 수정
DELETE /profile                    # 프로필 삭제
POST   /profile/fields             # 전문 분야 설정
POST   /profile/areas              # 활동 지역 설정
```

#### 포트폴리오 (Portfolio)

```
POST   /portfolios                 # 포트폴리오 생성
GET    /portfolios                 # 내 포트폴리오 목록
GET    /portfolios/:id             # 포트폴리오 상세 조회
PATCH  /portfolios/:id             # 포트폴리오 수정
DELETE /portfolios/:id             # 포트폴리오 삭제
POST   /portfolios/:id/media       # 미디어 추가
DELETE /portfolios/:id/media/:mediaId  # 미디어 삭제
```

#### 파일 업로드 (Upload)

```
POST   /upload                     # 파일 업로드
DELETE /upload/:filename           # 파일 삭제
```

#### 공개 프로필 (Public)

```
GET    /public/:slug               # 공개 프로필 조회 (인증 불필요)
```

---

## 🔐 환경 변수

### 필수 환경 변수

`.env.development` 또는 `.env.production` 파일을 생성하고 다음 값을 설정하세요:

```bash
# 환경
NODE_ENV=development

# 데이터베이스
DATABASE_URL="postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev"

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# 이메일 (Zoho Mail)
EMAIL_SERVICE=nodemailer
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=hello@bluecollar.cv
EMAIL_PASSWORD=your-zoho-app-password
EMAIL_FROM=hello@bluecollar.cv
EMAIL_REPLY_TO=support@bluecollar.cv

# SMS (개발 환경은 mock 사용)
SMS_PROVIDER=mock

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/callback/google

# Kakao OAuth
KAKAO_CLIENT_ID=your-kakao-app-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:4000/auth/callback/kakao

# Slack 알림 (선택)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WEBHOOK_URL

# API 주소
API_URL=http://localhost:4000

# 파일 저장 경로
STORAGE_PATH=./uploads
MEDIA_BASE_URL=http://localhost:4000
```

### 환경별 설정 파일

- `.env.development` - 로컬 개발 환경
- `.env.production` - 프로덕션 환경
- `.env.example` - 예시 파일 (git 추적)

---

## 🧪 개발 가이드

### 코드 컨벤션

#### 1. 주석 언어

- 모든 주석은 **한글**로 작성
- 기술 용어는 영어 그대로 사용 (예: Transaction, Middleware)

#### 2. Import 규칙

```typescript
// ✅ 절대 경로 사용
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";
import { DRIZZLE } from "@/infrastructure/database/drizzle.module";

// ✅ 모노레포 패키지
import { users, portfolios } from "@repo/database";

// ❌ 상위 디렉토리 참조 금지
import { SomeService } from "../../../services/some.service";
```

#### 3. DTO 검증

```typescript
// ✅ Zod 스키마 사용
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const EmailSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class EmailSignupDto extends createZodDto(EmailSignupSchema) {}
```

#### 4. 에러 처리

```typescript
// ✅ NestJS Exception 사용
throw new NotFoundException("해당 슬러그의 프로필을 찾을 수 없습니다");
throw new UnauthorizedException("유효하지 않은 인증 코드입니다");
throw new BadRequestException("파일 크기가 너무 큽니다");
```

### 명령어

```bash
# 개발
pnpm dev                    # 개발 서버 시작 (핫 리로드)
pnpm build                  # 프로덕션 빌드
pnpm lint                   # ESLint 검사
pnpm format                 # Prettier 포매팅

# 데이터베이스
pnpm dev:init               # DB 초기화 + 시드
pnpm db:down                # Docker Compose 종료
pnpm db:status              # DB 컨테이너 상태 확인
cd packages/database
pnpm db:generate            # 마이그레이션 파일 생성
pnpm db:push                # 스키마 푸시
pnpm db:seed                # 초기 데이터 삽입

# 테스트
pnpm test                   # 유닛 테스트
pnpm test:e2e               # E2E 테스트
pnpm test:cov               # 커버리지 리포트
```

### 브랜치 전략

```
main            # 프로덕션 배포용 (안정 버전)
└─ develop      # 개발 통합 브랜치
   ├─ feat/*    # 새로운 기능 개발
   ├─ fix/*     # 버그 수정
   └─ refactor/* # 리팩토링
```

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 리팩토링
docs: 문서 수정
test: 테스트 추가/수정
chore: 빌드, 설정 파일 수정
```

---

## 🔒 보안

### 구현된 보안 기능

- ✅ JWT 토큰 인증 (Access + Refresh)
- ✅ 비밀번호 암호화 (bcrypt)
- ✅ Rate Limiting (60초당 10회)
- ✅ CORS 설정 (서브도메인 대응)
- ✅ 이메일 정규화 (Gmail '+' 별칭 제거)
- ✅ SQL Injection 방지 (Drizzle ORM)
- ✅ XSS 방지 (입력값 검증)
- ✅ 파일 업로드 검증 (MIME 타입, 크기 제한)
- ✅ 환경 변수 분리 (.env 파일)

### 주의 사항

⚠️ **프로덕션 배포 전 반드시 확인:**

1. `.env.production` 파일의 `JWT_SECRET`을 강력한 값으로 변경
2. 데이터베이스 비밀번호 변경
3. OAuth 클라이언트 시크릿 설정
4. Zoho Mail 앱 비밀번호 발급
5. `.env` 파일을 `.gitignore`에 추가 (절대 git에 커밋하지 말 것)

---

## 📈 성능 최적화

### 구현된 최적화

1. **N+1 쿼리 제거**
   - 포트폴리오 미디어 조회 시 `inArray`로 일괄 조회
   - 10개 포트폴리오: 11번 쿼리 → 2번 쿼리 (81% 감소)

2. **Atomic Increment**
   - 조회수 증가 시 `sql` 템플릿 사용
   - Race condition 방지, 100% 정확한 카운팅

3. **이미지 최적화**
   - Sharp 라이브러리로 WebP 변환
   - 평균 70% 용량 절감
   - 최대 해상도 제한 (2560x1920)

4. **캐싱**
   - 일회용 이메일 블랙리스트 메모리 캐시 (O(1) 조회)

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👤 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

- **이메일**: support@bluecollar.cv
- **GitHub Issues**: [https://github.com/yourusername/bluecollar/issues](https://github.com/yourusername/bluecollar/issues)

---

## 🙏 감사의 말

이 프로젝트는 블루칼라 전문가들의 더 나은 커리어를 위해 만들어졌습니다.

---

<div align="center">
  <sub>Built with ❤️ by BlueCollar Team</sub>
</div>
