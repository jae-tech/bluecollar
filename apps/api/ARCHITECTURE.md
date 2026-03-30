# 🏗️ BlueCollar API - Domain-Driven Architecture

## 📋 개요

BlueCollar API는 **도메인 중심 아키텍처 (Domain-Driven Design)**를 따릅니다.

이 구조는:
- ✅ 각 도메인의 책임을 명확하게 분리
- ✅ 확장성과 유지보수성 향상
- ✅ 테스트 용이성 증대
- ✅ 팀 협업 효율화

---

## 📁 폴더 구조

```
src/
├── domains/                    # 비즈니스 도메인별 모듈
│   ├── auth/                   # 인증 도메인
│   │   ├── controllers/        # HTTP 요청 처리
│   │   │   └── auth.controller.ts
│   │   ├── services/           # 비즈니스 로직
│   │   │   └── auth.service.ts
│   │   ├── dtos/               # 데이터 전송 객체
│   │   │   └── create-worker.dto.ts
│   │   ├── entities/           # 도메인 엔티티 (향후)
│   │   ├── repositories/       # 데이터 접근 (향후)
│   │   ├── auth.module.ts      # 도메인 모듈
│   │   └── index.ts            # 도메인 공개 API
│   │
│   ├── workers/                # 작업자 도메인
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dtos/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── workers.module.ts
│   │   └── index.ts
│   │
│   ├── clients/                # 고객 도메인
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dtos/
│   │   ├── clients.module.ts
│   │   └── index.ts
│   │
│   └── inquiries/              # 문의 도메인
│       ├── controllers/
│       ├── services/
│       ├── dtos/
│       ├── inquiries.module.ts
│       └── index.ts
│
├── infrastructure/             # 기술적 기반 구조
│   ├── database/               # 데이터베이스 설정
│   │   ├── drizzle.module.ts
│   │   └── migrations/
│   ├── logging/                # 로깅 설정
│   ├── config/                 # 환경 설정
│   └── cache/                  # 캐시 설정 (선택)
│
├── common/                     # 공통 유틸리티
│   ├── filters/                # 예외 필터
│   ├── guards/                 # 인증/권한 가드
│   ├── interceptors/           # 요청/응답 인터셉터
│   ├── pipes/                  # 파이프 (검증)
│   ├── decorators/             # 커스텀 데코레이터
│   ├── exceptions/             # 공통 예외
│   └── index.ts
│
├── app.module.ts               # 루트 모듈
├── main.ts                     # 애플리케이션 진입점
└── metadata.ts
```

---

## 🎯 도메인 구조

### 각 도메인의 계층

```
[Domain Folder]
├── controllers/          # HTTP 요청 처리, 라우팅
│   └── auth.controller.ts
│
├── services/             # 비즈니스 로직, 트랜잭션
│   └── auth.service.ts
│
├── dtos/                 # 데이터 검증, 직렬화
│   └── create-worker.dto.ts
│
├── entities/             # 도메인 모델 (향후)
│   └── worker.entity.ts
│
├── repositories/         # 데이터 접근 계층 (향후)
│   └── worker.repository.ts
│
├── [domain].module.ts    # 도메인 모듈
└── index.ts              # 공개 API 정의
```

### 각 계층의 책임

| 계층 | 책임 | 예시 |
|------|------|------|
| **Controller** | HTTP 요청 처리, DTO 검증, 라우팅 | `@Post('workers/register')` |
| **Service** | 비즈니스 로직, 트랜잭션, 에러 처리 | 워커 등록 로직, DB 트랜잭션 |
| **DTO** | 입력 검증, 데이터 직렬화 | CreateWorkerDto, Zod 스키마 |
| **Entity** | 도메인 모델, 비즈니스 규칙 | Worker, Profile (향후) |
| **Repository** | 데이터 접근 추상화 | 쿼리 빌더, 캐싱 (향후) |

---

## 🔄 요청 흐름

```
HTTP Request
    ↓
Controller (라우팅, DTO 검증)
    ↓
Service (비즈니스 로직, 트랜잭션)
    ↓
Repository (데이터 접근) → Database
    ↓
Response (DTO 응답)
```

### 예: 워커 회원가입

```typescript
// 1. HTTP POST 요청
POST /auth/workers/register
{
  "phoneNumber": "01012345678",
  "businessName": "김타일",
  "slug": "kim-tile",
  "fieldCodes": ["FLD_TILE"],
  "areaCodes": ["AREA_SEOUL_GN"]
}

// 2. Controller에서 검증 및 Service 호출
@Post('workers/register')
async registerWorker(@Body(new ZodValidationPipe(...)) dto: CreateWorkerDto)

// 3. Service에서 비즈니스 로직 실행
await this.db.transaction(async (tx) => {
  // 중복 체크
  // 데이터 삽입
  // 매핑 테이블 삽입
})

// 4. Response 반환
{
  "id": "uuid",
  "phoneNumber": "01012345678",
  "role": "WORKER",
  "workerProfile": {...}
}
```

---

## 📦 Infrastructure 계층

### Database (drizzle.module.ts)
- **역할**: PostgreSQL 연결 및 Drizzle ORM 초기화
- **위치**: `src/infrastructure/database/`
- **사용**: DI를 통해 모든 도메인 서비스에 주입

```typescript
@Module({
  providers: [{
    provide: DRIZZLE,
    useFactory: async () => {
      const client = postgres(DATABASE_URL);
      return drizzle(client, { schema });
    }
  }],
  exports: [DRIZZLE]
})
export class DrizzleModule {}
```

### Config (향후)
- 환경 변수 관리
- 설정 값 중앙화

### Logging (기존)
- Pino를 통한 구조화된 로깅

---

## 🧩 Common 계층

공통으로 사용되는 유틸리티:

### Filters
```typescript
// 전역 예외 필터
@UseFilters(GlobalExceptionFilter)
```

### Guards
```typescript
// 인증/권한 검증
@UseGuards(AuthGuard)
```

### Interceptors
```typescript
// 요청/응답 처리
@UseInterceptors(LoggingInterceptor)
```

### Pipes
```typescript
// 검증 및 변환
@Body(new ValidationPipe())
```

### Decorators
```typescript
// 커스텀 데코레이터
@CurrentUser()
@Roles('WORKER')
```

---

## 📚 현재 구현 상태

### ✅ 완료된 도메인
- **Auth 도메인**
  - ✅ Controller (라우팅, Swagger)
  - ✅ Service (비즈니스 로직, 트랜잭션)
  - ✅ DTO (Zod 검증)
  - ⏳ Entity (계획 중)
  - ⏳ Repository (계획 중)

### ⏳ 향후 구현 도메인
- **Workers 도메인** (프로필 관리, 포트폴리오)
- **Clients 도메인** (고객 프로필)
- **Inquiries 도메인** (문의 관리)

---

## 🚀 새로운 도메인 추가 가이드

### 1단계: 폴더 구조 생성
```bash
mkdir -p src/domains/[domain-name]/{controllers,services,dtos,entities,repositories}
```

### 2단계: 기본 파일 생성
```
src/domains/[domain-name]/
├── controllers/[domain].controller.ts
├── services/[domain].service.ts
├── dtos/create-[entity].dto.ts
├── entities/[entity].entity.ts
├── repositories/[entity].repository.ts
├── [domain].module.ts
└── index.ts
```

### 3단계: Module 정의
```typescript
@Module({
  imports: [DrizzleModule, LoggerModule],
  controllers: [XyzController],
  providers: [XyzService, XyzRepository],
  exports: [XyzService],
})
export class XyzModule {}
```

### 4단계: App Module에 등록
```typescript
@Module({
  imports: [AuthModule, XyzModule],
})
export class AppModule {}
```

### 5단계: index.ts에서 공개 API 정의
```typescript
// src/domains/[domain]/index.ts
export * from './[domain].module';
export * from './services/[domain].service';
export * from './dtos/*';
```

---

## 📋 설계 원칙

### 1. 단일 책임 원칙 (SRP)
- 각 클래스는 하나의 책임만 가짐
- Controller는 HTTP, Service는 비즈니스 로직만

### 2. 의존성 역전 원칙 (DIP)
- 상세한 구현에 의존하지 말고 추상화에 의존
- DI를 통해 모듈 간 느슨한 결합

### 3. 도메인 중심 설계
- 데이터베이스나 프레임워크가 아닌 도메인 중심
- 도메인 언어로 폴더/파일 이름 지정

### 4. 테스트 용이성
- 각 계층을 독립적으로 테스트 가능
- Mock을 통한 의존성 주입

---

## 📊 확장성 예시

### 새로운 기능 추가 (예: 작업자 포트폴리오)
```
domains/workers/
├── controllers/
│   ├── worker.controller.ts     # 프로필 CRUD
│   └── portfolio.controller.ts   # 포트폴리오 CRUD
├── services/
│   ├── worker.service.ts
│   └── portfolio.service.ts
├── dtos/
│   ├── create-worker.dto.ts
│   ├── create-portfolio.dto.ts
│   └── update-portfolio.dto.ts
├── entities/
│   ├── worker.entity.ts
│   └── portfolio.entity.ts
├── repositories/
│   ├── worker.repository.ts
│   └── portfolio.repository.ts
└── workers.module.ts
```

---

## 🔗 관련 파일

- **test/README.md** - 테스트 실행 가이드
- **DEV_SETUP.md** - 개발 환경 설정
- **packages/database** - 스키마 및 마이그레이션

---

## 💡 팁

### 도메인 간 통신
```typescript
// WorkerService에서 AuthService 사용
@Module({
  imports: [AuthModule],
  providers: [WorkerService],
})
export class WorkerModule {}
```

### 트랜잭션 관리
```typescript
// Service에서 트랜잭션 사용
async registerWorker(dto: CreateWorkerDto) {
  return await this.db.transaction(async (tx) => {
    // 여러 쿼리 실행
    // 하나라도 실패하면 모두 롤백
  });
}
```

### 로깅
```typescript
// 각 계층에서 구조화된 로깅
this.logger.info({ userId, action }, 'User registered');
this.logger.error({ error }, 'Registration failed');
```

---

## 🎓 참고 자료

- [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
- [NestJS Architecture Patterns](https://docs.nestjs.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**이 아키텍처를 따르면서 지속 가능한 확장이 가능한 API를 개발하세요! 🚀**
