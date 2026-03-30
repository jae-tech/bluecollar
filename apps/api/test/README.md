# E2E 테스트 가이드

## 개요

이 프로젝트의 E2E 테스트는 **Vitest**를 사용하며, **Fastify + NestJS** 환경에서 실행됩니다.

## 테스트 특징

- **DB 트랜잭션 기반**: 모든 테스트는 자동 롤백되어 실제 DB를 오염시키지 않습니다
- **Drizzle ORM**: 데이터베이스 검증은 Drizzle ORM을 통해 수행됩니다
- **실제 앱 테스트**: NestJS 앱을 완전히 초기화하여 엔드-투-엔드 테스트합니다

## 필수 설정

### 1. 환경 변수 (.env)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bluecollar_db
```

프로젝트에서 제공하는 `.env` 파일을 사용하거나, 다음 위치 중 하나에 작성해야 합니다:
- `apps/api/.env`
- `apps/api/.env.local`
- 프로젝트 루트 `.env`
- `packages/database/.env`

### 2. 데이터베이스 준비

테스트 실행 전에 PostgreSQL 데이터베이스가 실행 중이어야 합니다:

```bash
# Docker 사용 예시
docker run -d \
  --name bluecollar_db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bluecollar_db \
  -p 5432:5432 \
  postgres:16
```

### 3. 스키마 준비

Drizzle 마이그레이션을 실행하여 데이터베이스 스키마를 준비합니다:

```bash
cd packages/database
pnpm db:push
```

## 테스트 실행

### 모든 테스트 실행

```bash
pnpm test
# 또는
pnpm -F api test
```

### E2E 테스트만 실행

```bash
pnpm test:e2e
# 또는
pnpm -F api test:e2e
```

### Watch 모드 (파일 변경 시 자동 재실행)

```bash
pnpm test:watch
# 또는
pnpm -F api test:watch
```

### 커버리지 리포트

```bash
pnpm test:cov
# 또는
pnpm -F api test:cov
```

## 테스트 구조

```
test/
├── e2e/
│   └── auth.e2e.spec.ts       # Auth 모듈 E2E 테스트
├── utils/
│   ├── app.ts                  # NestJS 앱 생성/종료
│   └── database.ts             # DB 연결 및 트랜잭션 유틸
├── setup.ts                    # 전역 테스트 설정
└── README.md                   # 이 파일
```

## Auth E2E 테스트 시나리오

`test/e2e/auth.e2e.spec.ts`에서 다음을 검증합니다:

### 1. 검증 실패 (400 Bad Request)
- 필수 필드 누락
- phoneNumber 형식 오류 (숫자만)
- slug 형식 오류 (소문자, 숫자, 하이픈만)
- fieldCodes/areaCodes 배열 비어있음

### 2. 중복 데이터 (409 Conflict)
- phoneNumber 중복
- slug 중복

### 3. 성공 (201 Created)
- 전체 필드로 가입
- 필수 필드만으로 가입
- 다중 분야/지역 선택

### 4. DB 검증
- `users` 테이블 레코드 확인
- `worker_profiles` 테이블 레코드 확인
- `worker_fields` 매핑 테이블 확인
- `worker_areas` 매핑 테이블 확인

## 트랜잭션 기반 테스트 원리

모든 테스트는 다음과 같이 자동 롤백됩니다:

```typescript
await withTransaction(async (tx) => {
  // 테스트 코드
  // 함수 종료 시 자동으로 롤백됨
});
```

이를 통해:
- ✅ 실제 데이터를 오염시키지 않음
- ✅ 테스트 간 데이터 독립성 보장
- ✅ 병렬 테스트 실행 가능

## 문제 해결

### 데이터베이스 연결 실패
```
Error: DATABASE_URL is not defined
```
→ `.env` 파일의 DATABASE_URL을 확인하세요.

### 타임아웃 에러
```
Error: Timeout
```
→ `vitest.config.ts`의 `testTimeout` 값을 증가시키세요 (기본값: 30000ms).

### 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::4000
```
→ 기존 NestJS 앱을 종료하고 테스트를 다시 실행하세요.

## 팁

- 개별 테스트 실행: `vitest run test/e2e/auth.e2e.spec.ts`
- 특정 테스트만: `vitest run -t "should successfully register"`
- Debug 모드: `vitest --inspect-brk`

## 참고

- Vitest 문서: https://vitest.dev/
- NestJS 테스팅: https://docs.nestjs.com/fundamentals/testing
- Drizzle ORM: https://orm.drizzle.team/
