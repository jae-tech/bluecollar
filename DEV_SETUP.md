# BlueCollar 개발 환경 초기 설정 가이드

## 📋 필수 요구사항

- **Node.js**: v22 이상
- **pnpm**: v10.28.2 이상
- **Docker**: 최신 버전
- **Docker Compose**: 최신 버전
- **PostgreSQL**: 17 (Docker로 제공)

## 🚀 빠른 시작 (One-liner)

```bash
pnpm dev:init
```

이 명령어 하나로 다음을 모두 자동으로 수행합니다:
1. ✅ Docker PostgreSQL 컨테이너 시작
2. ✅ 데이터베이스 연결 대기 (최대 30초)
3. ✅ 스키마 마이그레이션 실행
4. ✅ 시드 데이터 삽입

## 📝 환경 변수 설정

### 1️⃣ 환경 변수 파일 확인

다음 3개 위치에 `.env` 파일이 자동으로 생성되어 있어야 합니다:

```bash
.env                           # 루트
apps/api/.env                 # API 서버
packages/database/.env        # 데이터베이스
```

각 파일의 `DATABASE_URL`이 다음과 같이 설정되어 있는지 확인하세요:

```
DATABASE_URL="postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev"
```

### 2️⃣ 환경 변수 검증

설정이 올바른지 확인하려면:

```bash
pnpm verify:env
```

예상 출력:
```
✅ Root (.env): ...
✅ API (.env): ...
✅ Database (.env): ...

📋 Current Environment Variables:
DATABASE_URL: ✅ Set

📡 Database Connection Info:
   Host: localhost
   Port: 5432
   Database: bluecollar_dev
   User: bluecollar_user

✅ All environment files are properly configured!
```

## 🐳 Docker 관리 명령어

### DB 시작 (수동)

```bash
docker-compose up -d
```

### DB 상태 확인

```bash
pnpm db:status
```

### DB 정지

```bash
pnpm db:down
```

### DB 정지 및 볼륨 삭제 (완전 초기화)

```bash
docker-compose down -v
```

## 🗄️ 데이터베이스 마이그레이션

### 스키마 마이그레이션

```bash
pnpm --filter @repo/database db:push
```

또는 특정 마이그레이션만:

```bash
cd packages/database
pnpm db:push
```

### 시드 데이터 삽입

```bash
pnpm --filter @repo/database db:seed
```

## 🔄 전체 초기화 시나리오

### 시나리오 1️⃣: 처음 설정 (권장)

```bash
# 1. 환경 변수 확인
pnpm verify:env

# 2. 한 번에 모든 설정 완료
pnpm dev:init
```

### 시나리오 2️⃣: DB 초기화 (기존 설정 변경)

```bash
# 1. 기존 DB 제거
pnpm db:down

# 2. 새로 설정
pnpm dev:init
```

### 시나리오 3️⃣: 스키마/시드만 다시 적용

```bash
# DB 상태 확인 (실행 중인지)
pnpm db:status

# DB 실행 중이면 마이그레이션 + 시드 실행
pnpm --filter @repo/database db:push && pnpm --filter @repo/database db:seed
```

## 📦 의존성 설치

처음 git clone 후:

```bash
pnpm install
```

## 🔧 개발 서버 시작

### 1️⃣ dev:init으로 초기 설정 완료 후

### 2️⃣ 개발 서버 시작

```bash
# 모든 앱 watch 모드로 시작
pnpm dev

# 또는 특정 앱만:
pnpm -F api dev
```

### 3️⃣ API 테스트

```bash
# 모든 테스트 실행
pnpm -F api test

# E2E 테스트만
pnpm -F api test:e2e

# Watch 모드
pnpm -F api test:watch
```

## 📍 접근 주소

| 서비스 | URL | 설명 |
|--------|-----|------|
| API | http://localhost:4000 | NestJS + Fastify |
| Swagger | http://localhost:4000/docs | API 문서 |
| PostgreSQL | localhost:5432 | DB 연결 주소 |
| Redis | localhost:6379 | 캐시/세션 (선택) |

## 🐛 문제 해결

### ❌ "docker-compose command not found"

Docker Desktop이 설치되어 있는지 확인하세요.

```bash
docker-compose --version
```

### ❌ "PostgreSQL connection refused"

1. Docker 컨테이너가 실행 중인지 확인:
   ```bash
   pnpm db:status
   ```

2. DB가 실행 중이 아니면:
   ```bash
   pnpm dev:init
   ```

3. 포트 5432가 이미 사용 중인 경우:
   ```bash
   # 충돌 확인
   lsof -i :5432

   # 포트 변경 (docker-compose.yml 수정)
   # - "5433:5432"로 변경
   ```

### ❌ "wait-for-db.js timeout"

DB가 느리게 시작되는 경우. 잠시 대기 후 다시 시도:

```bash
sleep 10 && pnpm --filter @repo/database db:push
```

### ❌ "DATABASE_URL not found"

`.env` 파일이 없거나 경로가 잘못된 경우:

```bash
# 1. .env.example에서 복사
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env

# 2. DATABASE_URL 확인
pnpm verify:env
```

### ❌ "Module not found: @repo/database"

pnpm 의존성 다시 설치:

```bash
pnpm install
pnpm --filter @repo/database install
```

## 📚 추가 정보

### 프로젝트 구조

```
bluecollar/
├── apps/
│   ├── api/                 # NestJS + Fastify API
│   └── ...
├── packages/
│   ├── database/            # Drizzle ORM + PostgreSQL
│   └── ...
├── docker-compose.yml       # PostgreSQL + Redis
├── .env                     # 환경 변수
└── scripts/
    ├── wait-for-db.js       # DB 대기 스크립트
    └── verify-env.js        # 환경 변수 검증
```

### Turbo Monorepo

```bash
# 모든 패키지 빌드
pnpm build

# 특정 패키지만 빌드
pnpm -F api build

# 캐시 초기화
pnpm turbo prune
```

## 🤝 팁

- Git 커밋 전에 타입 체크와 lint 실행:
  ```bash
  pnpm check-types && pnpm lint
  ```

- 코드 포맷팅:
  ```bash
  pnpm format
  ```

- 개발 중 자동 포맷팅 (IDE 설정):
  - prettier를 VSCode "Format on Save"로 설정

## 🔗 유용한 링크

- [BlueCollar API Swagger](http://localhost:4000/docs)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [NestJS 문서](https://docs.nestjs.com/)
- [Drizzle ORM 문서](https://orm.drizzle.team/)

---

**모든 설정이 완료되었습니다! 행운을 빕니다! 🚀**
