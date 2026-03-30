# 🔧 에러 해결 완료

## 발생했던 에러들

### 1️⃣ Drizzle ORM 버전 불일치
```
Types have separate declarations of a private property 'shouldInlineParams'
```

**원인:**
- `packages/database`: drizzle-orm@0.38.0
- `apps/api`: drizzle-orm@0.45.1

**해결:**
- ✅ packages/database의 drizzle-orm을 0.45.1로 통일
- ✅ drizzle-kit도 0.28.0으로 업데이트

### 2️⃣ Vitest 설정 에러
```
'loader' does not exist in type 'InlineConfig'
```

**원인:** vitest.config.ts에서 지원되지 않는 'loader' 옵션 사용

**해결:**
- ✅ vitest.config.ts에서 'loader: "tsx"' 옵션 제거

### 3️⃣ 모듈 해석 에러
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'packages/database/src/schema'
```

**원인:**
- packages/database가 빌드되지 않음
- TypeScript 소스 파일을 직접 참조하려고 함
- package.json에서 main/types가 src를 가리킴

**해결:**
- ✅ packages/database에 tsconfig.json 생성
- ✅ packages/database에 build 스크립트 추가
- ✅ package.json의 main/types를 dist 폴더로 변경
- ✅ turbo.json에서 dist 폴더 출력 추가
- ✅ dev:init 스크립트에 build 단계 추가

### 4️⃣ Drizzle ORM 타입 에러
```
No overload matches this call in auth.service.ts
```

**원인:** db 인스턴스의 타입이 any로 설정됨

**해결:**
- ✅ PostgresJsDatabase 타입으로 정확하게 지정
- ✅ transaction 콜백의 tx 타입 자동 추론

---

## ✅ 수정된 파일들

### 1. packages/database/package.json
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1"  // 0.38.0 → 0.45.1
  }
}
```

### 2. packages/database/tsconfig.json (신규)
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. apps/api/vitest.config.ts
```typescript
// 'loader: "tsx"' 제거
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // ... 나머지 설정
  },
});
```

### 4. apps/api/src/modules/auth/auth.service.ts
```typescript
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '@repo/database';

export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    // ...
  ) {}
}
```

### 5. root/package.json
```json
{
  "scripts": {
    "dev:init": "pnpm build && docker-compose up -d && ..."
  }
}
```

### 6. root/turbo.json
```json
{
  "build": {
    "outputs": ["dist/**", ".next/**"]
  }
}
```

---

## 🚀 해결 방법

### 상황 1: 처음부터 시작하는 경우

```bash
# 1. 의존성 설치
pnpm install

# 2. 전체 패키지 빌드
pnpm build

# 3. 타입 체크
pnpm check-types

# 4. 개발 환경 초기화
pnpm dev:init
```

### 상황 2: 이미 설치한 경우 (재빌드)

```bash
# 1. 캐시 제거 및 재빌드
rm -rf packages/database/dist
pnpm build

# 2. 타입 체크 (선택사항)
pnpm check-types

# 3. 의존성 다시 설치 (선택사항)
pnpm install --force
```

### 상황 3: 특정 패키지만 빌드

```bash
# packages/database만 빌드
pnpm -F @repo/database build

# apps/api만 빌드
pnpm -F api build
```

---

## 📋 확인 사항

### 빌드 확인
```bash
# 모든 패키지 빌드
pnpm build

# 결과:
# ✅ packages/database/dist 폴더 생성
# ✅ apps/api/dist 폴더 생성
```

### 타입 체크
```bash
# TypeScript 컴파일 확인
pnpm check-types

# 에러가 없어야 함
```

### 패키지 확인
```bash
# @repo/database 패키지 확인
pnpm -F @repo/database list
```

---

## 🔗 버전 정보

| 패키지 | 버전 | 상태 |
|--------|------|------|
| drizzle-orm | ^0.45.1 | ✅ 통일됨 |
| drizzle-kit | ^0.28.0 | ✅ 호환성 |
| typescript | ^5.9.2 | ✅ OK |
| vitest | ^4.0.18 | ✅ OK |

---

## 💡 참고사항

### Drizzle ORM 버전 통일의 중요성
- 여러 패키지에서 Drizzle을 사용할 때 버전을 맞춰야 함
- 버전 불일치 시 타입 에러 발생
- workspace 환경에서 동일한 버전 사용 필수

### TypeScript 빌드 설정
- packages/database는 리모트 패키지이므로 빌드 필요
- dist 폴더가 생성되어야 다른 패키지에서 import 가능
- tsconfig.json과 package.json의 main/types 일치 필요

### Vitest 설정
- vitest.config.ts에서 지원하는 옵션만 사용
- tsx 로더는 자동으로 처리됨 (명시적 설정 불필요)

---

## 🎯 다음 단계

```bash
# 1️⃣ 모든 설정 완료 확인
pnpm verify:env

# 2️⃣ 빌드 및 초기화
pnpm dev:init

# 3️⃣ 개발 시작
pnpm dev

# 4️⃣ 테스트
pnpm -F api test
```

---

## ⚠️ 만약 여전히 에러가 발생하면

### 완전한 재설치
```bash
# 모든 node_modules 제거
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# pnpm 캐시 제거
pnpm store prune

# 의존성 다시 설치
pnpm install

# 빌드
pnpm build
```

### 특정 패키지 문제
```bash
# packages/database 문제 시
cd packages/database
rm -rf dist node_modules
pnpm install
pnpm build

# apps/api 문제 시
cd apps/api
rm -rf dist node_modules
pnpm install
pnpm build
```

---

**모든 에러가 해결되었습니다! 이제 개발을 시작할 수 있습니다. 🎉**
