# 🐳 Docker & Environment Setup Complete

## ✅ 완료된 작업 목록

### 1️⃣ 환경 변수 파일 생성

다음 위치에 `.env.example` 파일이 생성되었습니다:

```
.env.example                          # 루트 환경 변수 템플릿
apps/api/.env.example                # API 서버 환경 변수 템플릿
packages/database/.env.example       # 데이터베이스 환경 변수 템플릿
```

각 파일에는 다음 설정이 포함되어 있습니다:

```bash
DATABASE_URL="postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev"
```

### 2️⃣ 환경 변수 파일 업데이트

실제 `.env` 파일들이 docker-compose 설정에 맞게 업데이트되었습니다:

```
✅ .env                              (루트)
✅ apps/api/.env                     (API 서버)
✅ packages/database/.env            (데이터베이스)
```

### 3️⃣ DB 연결 검증 유틸 생성

#### `scripts/wait-for-db.js`
- Docker PostgreSQL 컨테이너의 준비 상태를 확인
- TCP 연결로 DB 가용성 검증 (최대 30회, 1초 간격)
- 모든 진행 상황을 콘솔에 출력

#### `scripts/verify-env.js`
- 모든 `.env` 파일의 존재 여부 확인
- DATABASE_URL 설정 검증
- 파싱된 연결 정보 표시 (host, port, database, user)

### 4️⃣ 루트 package.json 스크립트 추가

```json
{
  "scripts": {
    "verify:env": "node ./scripts/verify-env.js",
    "dev:init": "docker-compose up -d && node ./scripts/wait-for-db.js && pnpm --filter @repo/database db:push && pnpm --filter @repo/database db:seed",
    "db:down": "docker-compose down",
    "db:status": "docker-compose ps"
  }
}
```

## 🚀 사용 방법

### 🎯 한 번에 모든 설정 완료

```bash
pnpm dev:init
```

**실행 순서:**
1. `docker-compose up -d` → PostgreSQL & Redis 컨테이너 시작
2. `node ./scripts/wait-for-db.js` → DB 준비 대기 (최대 30초)
3. `pnpm db:push` → 스키마 마이그레이션
4. `pnpm db:seed` → 초기 데이터 삽입

### ✅ 환경 변수 검증

```bash
pnpm verify:env
```

출력 예:
```
🔍 Environment Variables Verification

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

### 🐳 Docker 상태 확인

```bash
pnpm db:status
```

### 🛑 Docker 중지

```bash
pnpm db:down
```

## 📊 Docker Compose 구성

**docker-compose.yml**에는 다음이 포함됩니다:

### PostgreSQL 17 Alpine
```yaml
- Container: bluecollar-db
- Image: postgres:17-alpine
- Port: 5432
- User: bluecollar_user
- Password: bluecollar_password
- Database: bluecollar_dev
- Volume: postgres_data (영구 저장)
```

### Redis 7 Alpine (선택사항)
```yaml
- Container: bluecollar-redis
- Image: redis:7-alpine
- Port: 6379
- 목적: 인증번호 제한, 캐싱 (향후 필요 시)
```

## 🔗 연결 정보

| 서비스 | 연결 문자열 | 포트 |
|--------|-----------|------|
| PostgreSQL | postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev | 5432 |
| Redis | redis://localhost | 6379 |

## 📂 생성된 파일 구조

```
bluecollar/
├── .env                              # 루트 환경 변수 (git 무시됨)
├── .env.example                      # 루트 환경 변수 템플릿 (git 추적)
├── DEV_SETUP.md                      # 개발 환경 설정 가이드 (신규)
├── DOCKER_ENV_SETUP.md               # 이 파일
├── docker-compose.yml                # Docker 구성
├── apps/
│   └── api/
│       ├── .env                      # API 환경 변수 (git 무시됨)
│       └── .env.example              # API 환경 변수 템플릿 (git 추적)
├── packages/
│   └── database/
│       ├── .env                      # DB 환경 변수 (git 무시됨)
│       ├── .env.example              # DB 환경 변수 템플릿 (git 추적)
│       └── src/
│           └── scripts/
│               └── seed.ts           # 시드 스크립트
└── scripts/
    ├── wait-for-db.js                # DB 준비 대기 (신규)
    └── verify-env.js                 # 환경 변수 검증 (신규)
```

## 🔒 보안 주의사항

### .gitignore 설정
- ✅ `.env` 파일은 git에 커밋되지 않음
- ✅ `.env.example` 만 버전 관리됨
- 📝 실제 환경 변수는 .env 파일에만 저장

### 환경별 설정
```bash
# 개발 환경 (.env)
DATABASE_URL="postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev"

# 운영 환경 (별도 설정)
# 실제 운영 시에는 보안이 강화된 자격증명을 사용하세요
```

## ⚠️ 주의사항

### Docker 첫 실행 시
- PostgreSQL이 시작되는 데 10~30초 소요될 수 있습니다
- `pnpm dev:init`은 이를 자동으로 처리합니다

### Windows 사용자
- Docker Desktop이 설치되어 있어야 합니다
- PowerShell 또는 Git Bash에서 명령 실행 권장

### 기존 환경 변수 명칭 변경
이전 명칭:
```
user:password@localhost:5432/bluecollar_db
```

새로운 명칭:
```
bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev
```

docker-compose.yml과 일치하도록 업데이트되었습니다.

## 🧪 검증 단계

### 1️⃣ 환경 변수 확인
```bash
pnpm verify:env
# 모든 .env 파일과 DATABASE_URL 확인
```

### 2️⃣ Docker 실행
```bash
pnpm dev:init
# PostgreSQL 시작 → DB 연결 대기 → 마이그레이션 → 시드 삽입
```

### 3️⃣ 개발 서버 실행
```bash
pnpm dev
# API 서버 시작
```

### 4️⃣ API 접근
```
http://localhost:4000/docs
```

## 📚 참고 자료

- **DEV_SETUP.md**: 상세한 개발 환경 설정 가이드
- **docker-compose.yml**: Docker 서비스 구성
- **apps/api/test/README.md**: E2E 테스트 실행 방법
- **packages/database/src/scripts/seed.ts**: 시드 데이터 정의

## 💡 팁

### 빠른 초기화
```bash
# 모든 것을 한 번에
pnpm dev:init

# 또는 단계별로
pnpm verify:env                                  # 환경 확인
docker-compose up -d                            # DB 시작
sleep 10                                        # 대기
pnpm --filter @repo/database db:push           # 마이그레이션
pnpm --filter @repo/database db:seed           # 시드 삽입
```

### 완전 초기화 (기존 DB 제거)
```bash
pnpm db:down                                    # DB 중지
docker-compose down -v                         # 볼륨 포함 제거
pnpm dev:init                                   # 완전 초기화
```

### DB 직접 접근
```bash
# psql 클라이언트로 접근 (설치된 경우)
psql postgresql://bluecollar_user:bluecollar_password@localhost:5432/bluecollar_dev

# 또는 DBeaver 같은 GUI 클라이언트 사용
```

---

**모든 설정이 완료되었습니다! 이제 개발을 시작할 수 있습니다. 🎉**

자세한 사항은 **DEV_SETUP.md**를 참고하세요.
