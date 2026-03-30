# 📁 Domain-Driven Folder Structure Renewal

## ✨ 리뉴얼 완료!

BlueCollar API의 폴더 구조가 **기능 중심에서 도메인 중심**으로 완전히 리뉴얼되었습니다.

---

## 📊 변경 전후 비교

### 🔴 이전 구조 (기능 중심)
```
src/
├── db/                          # 기술 계층
│   ├── drizzle.module.ts
│   └── schema.ts
├── modules/                     # 모듈 모음
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.module.ts
│       ├── auth.service.ts
│       └── dto/
│           └── create-worker.dto.ts
├── common/                      # 공통 유틸
├── app.module.ts
└── main.ts
```

### 🟢 새로운 구조 (도메인 중심)
```
src/
├── domains/                     # 비즈니스 도메인
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── dtos/
│   │   │   └── create-worker.dto.ts
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── auth.module.ts
│   │   └── index.ts
│   ├── workers/                 # 향후
│   ├── clients/                 # 향후
│   └── inquiries/               # 향후
├── infrastructure/              # 기술적 기반 구조
│   └── database/
│       └── drizzle.module.ts
├── common/                      # 공통 유틸
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── decorators/
│   └── index.ts
├── app.module.ts
└── main.ts
```

---

## 🎯 주요 개선 사항

### 1️⃣ 명확한 책임 분리
```
Before (혼합됨):
  modules/auth/
  ├── auth.controller.ts
  ├── auth.service.ts
  ├── auth.module.ts
  └── dto/

After (계층별 분리):
  domains/auth/
  ├── controllers/    ← HTTP 처리
  ├── services/       ← 비즈니스 로직
  ├── dtos/          ← 데이터 검증
  ├── entities/      ← 도메인 모델
  ├── repositories/  ← 데이터 접근
  └── auth.module.ts
```

### 2️⃣ 도메인별 완전 독립성
```
각 도메인은 자체적인 구조를 가짐:

domains/auth/
├── Controllers (라우팅)
├── Services (로직)
├── DTOs (검증)
├── Entities (모델)
├── Repositories (데이터)
└── Module (통합)

같은 구조가 반복되므로 일관성 유지!
```

### 3️⃣ 확장 용이성
```
새로운 도메인 추가 시:

domains/workers/       ← 신규
├── controllers/
├── services/
├── dtos/
├── entities/
├── repositories/
└── workers.module.ts

domains/clients/       ← 신규
├── controllers/
├── services/
├── dtos/
└── clients.module.ts

모두 동일한 패턴!
```

### 4️⃣ 팀 협업 효율화
```
개발자별 담당 도메인:

👨‍💻 Developer A: domains/workers
👩‍💻 Developer B: domains/clients
👨‍💻 Developer C: domains/inquiries

병렬 개발 가능하고 충돌 최소화!
```

---

## 📁 완성된 구조 상세

### domains/auth/ (완성)
```
domains/auth/
├── controllers/
│   └── auth.controller.ts          ✅ HTTP 요청 처리
├── services/
│   └── auth.service.ts             ✅ 비즈니스 로직
├── dtos/
│   └── create-worker.dto.ts        ✅ DTO 검증
├── entities/
│   └── (향후 추가)                  ⏳
├── repositories/
│   └── (향후 추가)                  ⏳
├── auth.module.ts                  ✅ 모듈 정의
└── index.ts                        ✅ 공개 API
```

### infrastructure/ (완성)
```
infrastructure/
├── database/
│   └── drizzle.module.ts           ✅ DB 연결
├── config/
│   └── (향후 추가)                  ⏳
└── logging/
    └── (향후 추가)                  ⏳
```

### common/ (기본 구조)
```
common/
├── filters/                        (향후)
├── guards/                         (향후)
├── interceptors/                   (향후)
├── pipes/                          (향후)
├── decorators/                     (향후)
└── index.ts
```

---

## 🔄 마이그레이션 결과

### ✅ 완료된 작업
1. ✅ 폴더 구조 재설계
2. ✅ Auth 도메인 마이그레이션
3. ✅ Infrastructure 계층 구성
4. ✅ App Module 업데이트
5. ✅ Import 경로 수정
6. ✅ 문서화 (ARCHITECTURE.md, MIGRATION_GUIDE.md)

### ⏳ 향후 작업
1. ⏳ Workers 도메인 개발
2. ⏳ Clients 도메인 개발
3. ⏳ Inquiries 도메인 개발
4. ⏳ Entity & Repository 패턴 도입
5. ⏳ Guards, Filters, Interceptors 추가

---

## 📊 파일 이동 내역

### 이동된 파일들
```
src/modules/auth/auth.controller.ts
→ src/domains/auth/controllers/auth.controller.ts

src/modules/auth/auth.service.ts
→ src/domains/auth/services/auth.service.ts

src/modules/auth/dto/create-worker.dto.ts
→ src/domains/auth/dtos/create-worker.dto.ts

src/modules/auth/auth.module.ts
→ src/domains/auth/auth.module.ts

src/db/drizzle.module.ts
→ src/infrastructure/database/drizzle.module.ts
```

### 수정된 Import 경로
```typescript
// Before
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';

// After
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { AuthModule } from './domains/auth/auth.module';
```

---

## 🚀 사용 방법

### 1️⃣ 기존 구조 정보 확인
```bash
# 이 문서들을 순서대로 읽으세요
cat ARCHITECTURE.md           # 아키텍처 상세 설명
cat MIGRATION_GUIDE.md        # 마이그레이션 방법
cat apps/api/ARCHITECTURE.md  # API 아키텍처 상세
```

### 2️⃣ 새로운 도메인 추가
```bash
# ARCHITECTURE.md의 "새로운 도메인 추가 가이드" 참고
mkdir -p src/domains/workers/{controllers,services,dtos,entities,repositories}
```

### 3️⃣ 개발 시작
```bash
# 빌드
pnpm build

# 개발 서버
pnpm dev

# 테스트
pnpm -F api test
```

---

## 💡 핵심 설계 원칙

### 1. 도메인 우선 (Domain-First)
```
❌ 기술 중심: DB, API, Cache 먼저 생각
✅ 도메인 중심: Auth, Workers, Clients 도메인 중심
```

### 2. 계층 분리 (Layered Architecture)
```
┌─────────────────────────────┐
│     HTTP Controller         │ ← 라우팅, 요청 처리
├─────────────────────────────┤
│     Service                 │ ← 비즈니스 로직
├─────────────────────────────┤
│     Repository / ORM        │ ← 데이터 접근
├─────────────────────────────┤
│     Database                │ ← 실제 데이터
└─────────────────────────────┘
```

### 3. 관심사의 분리 (Separation of Concerns)
```
Controller  → HTTP만 담당
Service     → 비즈니스 로직만 담당
Repository  → 데이터 접근만 담당
DTO         → 검증만 담당
```

### 4. 의존성 역전 (Dependency Inversion)
```
정책: 상세한 구현에 의존하지 말고 추상화에 의존

예:
❌ Service가 AuthRepository에 직접 의존
✅ Service가 IAuthRepository 인터페이스에 의존
```

---

## 📈 확장성 로드맵

### Phase 1️⃣: 현재 (완료)
```
src/domains/auth/          ✅
src/infrastructure/        ✅
src/common/               ✅
```

### Phase 2️⃣: 즉시 (1-2주)
```
src/domains/workers/       ← 프로필, 포트폴리오
src/domains/clients/       ← 고객 정보
src/domains/inquiries/     ← 문의 관리
```

### Phase 3️⃣: 중기 (2-4주)
```
src/common/guards/         ← 인증 가드
src/common/filters/        ← 예외 필터
src/common/interceptors/   ← 로깅
```

### Phase 4️⃣: 장기 (1-2개월)
```
Event System               ← 도메인 이벤트
CQRS Pattern              ← 읽기/쓰기 분리
Domain Layer Enrichment   ← Rich Domain Model
```

---

## 🎓 학습 자료

### 도메인 중심 설계
- [Domain-Driven Design (Eric Evans)](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))

### NestJS 패턴
- [NestJS Architecture](https://docs.nestjs.com/)
- [Module Pattern](https://docs.nestjs.com/modules)
- [Dependency Injection](https://docs.nestjs.com/fundamentals/dependency-injection)

---

## ✅ 검증 체크리스트

- [x] 폴더 구조 재설계
- [x] Auth 도메인 마이그레이션
- [x] Import 경로 업데이트
- [x] App Module 수정
- [x] ARCHITECTURE.md 작성
- [x] MIGRATION_GUIDE.md 작성
- [ ] 새로운 도메인 추가 (Workers)
- [ ] Entity & Repository 패턴 도입
- [ ] Guards & Filters 추가
- [ ] Event System 구현

---

## 🎯 다음 단계

```bash
# 1. 아키텍처 이해
cat ARCHITECTURE.md

# 2. 빌드 확인
pnpm build

# 3. 타입 체크
pnpm check-types

# 4. 개발 시작
pnpm dev

# 5. 테스트
pnpm -F api test
```

---

## 📞 Q&A

### Q: 왜 도메인 중심으로 변경했나요?
A: 확장성, 유지보수성, 팀 협업을 위해 도메인 중심 설계가 더 효과적이기 때문입니다.

### Q: 기존 폴더는 어떻게 하나요?
A: 기존 폴더도 유지할 수 있지만, 새로운 도메인은 모두 새 구조로 개발하는 것이 좋습니다.

### Q: 기존 코드는 자동으로 변환되나요?
A: 아니요. MIGRATION_GUIDE.md를 따라 수동으로 마이그레이션해야 합니다.

### Q: 개발 시간이 더 걸리지 않나요?
A: 초기에는 약간 더 오래 걸리지만, 장기적으로 유지보수 시간을 크게 줄여줍니다.

---

**Domain-Driven Architecture로의 완전한 전환 완료! 🎉**

지속 가능하고 확장 가능한 API 개발을 시작하세요! 🚀
