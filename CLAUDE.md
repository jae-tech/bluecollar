# 프로젝트 가이드라인 & 컨벤션 (Project BlueCollar)

## 1. 기술 스택 및 환경

- Framework: NestJS (Fastify Adapter)
- Runtime: Node.js (v22+)
- ORM: Drizzle ORM
- Validation: Zod (nestjs-zod)
- Logger: nestjs-pino
- Database: PostgreSQL (Docker Compose)
- Test: Vitest

## 2. 아키텍처 원칙 (Domain-Driven Design)

모든 비즈니스 로직은 `apps/api/src/modules` 내에 도메인 단위로 격리한다.

- **Common**: 전역 유틸, 필터, 가드
- **Infrastructure**: 외부 API(SMS, S3 등), DB 연결 로직
- **Domains**: 비즈니스 핵심 서비스 로직
- **DB**: Drizzle 설정 및 공유 레포지토리

## 3. 임포트 규칙 (Import Path Optimization)

- 절대 경로: `src` 기준 `@/` 별칭 사용 (예: `@/common/filters/...`)
- 상대 경로: 같은 폴더 또는 하위 폴더일 경우에만 `./` 사용 (절대 경로보다 짧을 때)
- 상위 참조 금지: `../../` 사용 금지, 무조건 `@/` 사용
- 모노레포 패키지: `@repo/database`, `@repo/schema` 사용

## 4. 코딩 컨벤션

- **Zod First**: 모든 DTO와 환경 변수는 Zod 스키마를 통해 검증한다.
- **Transaction**: 여러 테이블을 수정하는 서비스 로직은 반드시 Drizzle 트랜잭션을 사용한다.
- **Error Handling**: Custom Exception을 사용하여 의미 있는 에러 메시지와 상태 코드를 반환한다.
- **Asynchronous**: 모든 DB 작업 및 외부 통신은 `async/await`를 기본으로 한다.
- **주석 언어**: 기본적으로 모든 주석은 **한글**로 작성한다.
- **영어 혼용**: 기술적 용어나 영문 번역이 어색한 고유 명사(예: Slug, Transaction, Middleware 등)는 영어를 그대로 사용한다.
- **JSDoc**: 복잡한 서비스 메서드는 `@param`, `@returns` 등을 포함한 JSDoc을 한글로 작성하여 로직의 의도를 명확히 한다.

## 5. 테스트 및 완료 조건 (Definition of Done)

작업을 완료했다고 보고하기 전, 클로드코드는 반드시 다음을 수행한다.

1. **Lint & Build**: `pnpm build`를 실행하여 타입 에러가 없는지 확인한다.
2. **Formatting**: 모든 파일 수정 후 반드시 `pnpm prettier --write [수정된 파일 경로]`를 실행하여 컨벤션을 맞춘다.
3. **Unit Test**: 작업한 도메인의 `*.spec.ts`를 작성하고 `pnpm test`를 통과시킨다.
4. **E2E Test**: API 엔드포인트의 경우 Supertest를 활용한 E2E 테스트를 완료한다.
5. **Report**: 테스트 통과 결과 및 커버리지를 요약하여 보고한다.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

### Available skills

/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation,
/review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso,
/autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade