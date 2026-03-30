# 🔄 Domain-Driven Architecture 마이그레이션 가이드

## 📋 개요

API 프로젝트를 **폴더-기반 구조**에서 **도메인 중심 구조**로 마이그레이션했습니다.

### 변경 사항 요약

| 항목 | 이전 | 현재 |
|------|------|------|
| 구조 | 기능별 (modules) | 도메인별 (domains) |
| Database | src/db | src/infrastructure/database |
| Auth | modules/auth | domains/auth |
| 폴더 깊이 | modules/auth/dto | domains/auth/dtos (계층별 분리) |

---

## 📁 폴더 변경 사항

### 이전 구조
```
src/
├── db/
│   ├── drizzle.module.ts
│   └── schema.ts (실제로는 packages/database에 있음)
├── modules/
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.module.ts
│       ├── auth.service.ts
│       └── dto/
│           └── create-worker.dto.ts
├── app.module.ts
└── main.ts
```

### 새로운 구조
```
src/
├── domains/
│   └── auth/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── services/
│       │   └── auth.service.ts
│       ├── dtos/
│       │   └── create-worker.dto.ts
│       ├── auth.module.ts
│       └── index.ts
├── infrastructure/
│   └── database/
│       └── drizzle.module.ts
├── common/
│   └── index.ts
├── app.module.ts
└── main.ts
```

---

## ✅ 완료된 마이그레이션 작업

### 1️⃣ 파일 이동 및 재구성
- ✅ `src/modules/auth/` → `src/domains/auth/`
- ✅ `src/db/drizzle.module.ts` → `src/infrastructure/database/drizzle.module.ts`
- ✅ Controller, Service를 계층별 폴더로 재배치
- ✅ DTO를 dtos 폴더로 통합

### 2️⃣ Import 경로 업데이트
- ✅ `app.module.ts`의 import 경로 수정
- ✅ Auth 도메인의 모듈 import 경로 수정
- ✅ DRIZZLE 심볼 import 경로 업데이트

### 3️⃣ 문서 작성
- ✅ `ARCHITECTURE.md` - 아키텍처 설명 및 확장 가이드
- ✅ 이 가이드 문서

---

## 🚀 사용 방법

### 방법 1️⃣: 자동 마이그레이션 (권장)
기존 폴더가 있으면 그대로 두면 됩니다. 앞으로 모든 새로운 도메인은 새로운 구조로 개발하세요.

### 방법 2️⃣: 기존 폴더 정리 (선택)
혼동을 피하기 위해 기존 `src/modules`, `src/db` 폴더를 삭제할 수 있습니다.

```bash
# 기존 폴더 확인
ls -la apps/api/src/modules
ls -la apps/api/src/db

# 백업 후 삭제 (선택사항)
rm -rf apps/api/src/modules
rm -rf apps/api/src/db
```

### 방법 3️⃣: 점진적 마이그레이션
새로운 기능은 도메인 구조로, 기존 기능은 유지:
```typescript
// app.module.ts
@Module({
  imports: [
    // 새로운 도메인 구조
    AuthModule,     // src/domains/auth
    WorkerModule,   // src/domains/workers

    // 기존 폴더 구조 (과도기)
    // OldModuleModule,  // src/modules/old-module
  ],
})
export class AppModule {}
```

---

## 📊 현재 상태

### ✅ 마이그레이션 완료
```
Auth 도메인
├── Controller ✅
├── Service ✅
├── DTO ✅
├── Module ✅
└── index.ts ✅

Infrastructure
├── Database ✅
└── Config ⏳

Common
└── 기본 구조 ✅
```

### ⏳ 향후 마이그레이션
```
Workers 도메인  (신규)
Clients 도메인  (신규)
Inquiries 도메인 (신규)
```

---

## 🔧 기존 코드 마이그레이션 방법

### 단계 1️⃣: 새 폴더 구조 생성
```bash
mkdir -p src/domains/[domain-name]/{controllers,services,dtos,entities,repositories}
```

### 단계 2️⃣: 파일 이동
```bash
# 예: workers 도메인
mv src/modules/workers/controller.ts src/domains/workers/controllers/workers.controller.ts
mv src/modules/workers/service.ts src/domains/workers/services/workers.service.ts
mv src/modules/workers/dto.ts src/domains/workers/dtos/
```

### 단계 3️⃣: Import 경로 업데이트
**Before:**
```typescript
import { DrizzleModule } from '../../db/drizzle.module';
import { WorkersService } from './service';
```

**After:**
```typescript
import { DrizzleModule } from '../../../infrastructure/database/drizzle.module';
import { WorkersService } from '../services/workers.service';
```

### 단계 4️⃣: 모듈 파일 작성
```typescript
// src/domains/workers/workers.module.ts
import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { LoggerModule } from 'nestjs-pino';
import { WorkersController } from './controllers/workers.controller';
import { WorkersService } from './services/workers.service';

@Module({
  imports: [DrizzleModule, LoggerModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
```

### 단계 5️⃣: index.ts 파일 작성
```typescript
// src/domains/workers/index.ts
export { WorkersModule } from './workers.module';
export { WorkersService } from './services/workers.service';
export * from './dtos';
```

### 단계 6️⃣: App Module에 등록
```typescript
// src/app.module.ts
import { WorkersModule } from './domains/workers/workers.module';

@Module({
  imports: [
    LoggerModule.forRoot({...}),
    DrizzleModule,
    AuthModule,
    WorkersModule,  // 추가
  ],
})
export class AppModule {}
```

---

## ✨ 새로운 구조의 이점

### 1️⃣ 명확한 책임 분리
```
Controller  → HTTP 처리
Service     → 비즈니스 로직
DTO         → 데이터 검증
Entity      → 도메인 모델
Repository  → 데이터 접근
```

### 2️⃣ 확장 용이성
새로운 도메인 추가 시 동일한 구조 반복:
```
domains/
├── auth/
├── workers/
├── clients/        ← 신규 도메인
├── inquiries/      ← 신규 도메인
└── projects/       ← 신규 도메인
```

### 3️⃣ 팀 협업 효율화
각 도메인을 팀원이 병렬로 개발 가능:
```
개발자 A: domains/workers 개발
개발자 B: domains/clients 개발
개발자 C: domains/inquiries 개발
```

### 4️⃣ 테스트 용이성
도메인별로 독립적인 테스트:
```bash
pnpm -F api test -- src/domains/auth
pnpm -F api test -- src/domains/workers
```

---

## 📌 주의사항

### Import 경로 오류
```typescript
// ❌ 잘못된 경로
import { AuthService } from '../../modules/auth/auth.service';

// ✅ 올바른 경로
import { AuthService } from '../../domains/auth/services/auth.service';
// 또는
import { AuthService } from '../../domains/auth';
```

### 순환 의존성
도메인 간 의존성이 필요한 경우, imports를 통해 명시적으로:
```typescript
// 잘못된 방법 (순환 의존성)
@Module({
  imports: [WorkersModule],  // ❌ 도메인 간 직접 import 피하기
})

// 올바른 방법
@Module({
  imports: [
    { module: WorkersModule, exports: [WorkersService] }
  ],
})
```

### 기존 폴더 혼용
```bash
# 혼동 방지를 위해 마이그레이션 후 정리
rm -rf apps/api/src/modules
rm -rf apps/api/src/db
```

---

## 🔍 검증 방법

### 타입 체크
```bash
pnpm check-types
# ✅ No errors!
```

### 빌드 확인
```bash
pnpm build
# ✅ Successfully compiled
```

### 테스트 실행
```bash
pnpm -F api test
# ✅ All tests passed
```

### 개발 서버 시작
```bash
pnpm dev
# ✅ API 시작됨
```

---

## 📚 관련 문서

- **ARCHITECTURE.md** - 상세 아키텍처 설명
- **DEV_SETUP.md** - 개발 환경 설정
- **apps/api/ARCHITECTURE.md** - API 아키텍처 상세 설명

---

## 🆘 문제 해결

### Import 에러
```
Cannot find module 'src/domains/auth/services'
```
→ 파일 경로 확인 및 index.ts에서 export 확인

### 타입 에러
```
Type 'X' is not assignable to type 'Y'
```
→ import 경로가 올바른지 확인, 버전 호환성 체크

### 순환 의존성
```
Circular dependency detected
```
→ 도메인 간 의존성 구조 재검토, 특정 함수만 import

---

## ✅ 마이그레이션 체크리스트

- [ ] 새로운 폴더 구조 이해
- [ ] ARCHITECTURE.md 읽기
- [ ] 기존 코드의 import 경로 확인
- [ ] 새로운 도메인은 새 구조로 개발
- [ ] 타입 체크: `pnpm check-types`
- [ ] 빌드 확인: `pnpm build`
- [ ] 테스트 실행: `pnpm -F api test`
- [ ] 기존 폴더 정리 (선택)

---

## 🎯 다음 단계

1. **새로운 도메인 추가** (Workers, Clients, Inquiries)
2. **Entity 및 Repository 패턴 도입**
3. **Guard, Filter, Interceptor 추가**
4. **도메인 간 이벤트 시스템 구축**

---

**도메인 중심 아키텍처로의 마이그레이션 완료! 🎉**

더 지속 가능하고 확장 가능한 API 개발을 시작하세요! 🚀
