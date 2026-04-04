# ── Stage 1: 의존성 설치 ──────────────────────────────────────────────────────
FROM node:24-alpine AS deps

# pnpm 활성화
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /repo

# monorepo 루트 메타파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY patches/ ./patches/

# 각 패키지 package.json 복사 (레이어 캐시 최적화)
COPY packages/constants/package.json ./packages/constants/
COPY packages/database/package.json ./packages/database/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# 의존성 설치 (--frozen-lockfile으로 재현성 보장)
RUN pnpm install --frozen-lockfile


# ── Stage 2: 빌드 ─────────────────────────────────────────────────────────────
FROM deps AS builder

# 소스 복사
COPY packages/constants ./packages/constants
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config
COPY apps/api ./apps/api

# @repo/database 먼저 빌드 (api가 workspace 패키지 참조)
RUN pnpm --filter @repo/database build

# API 빌드
RUN pnpm --filter bluecollar-api build


# ── Stage 3: 프로덕션 런타임 ──────────────────────────────────────────────────
FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /repo

# 프로덕션 의존성만 재설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/constants/package.json ./packages/constants/
COPY packages/database/package.json ./packages/database/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

# 빌드 결과물 복사
COPY --from=builder /repo/packages/constants/src ./packages/constants/src
COPY --from=builder /repo/packages/database/dist ./packages/database/dist
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

# 업로드 디렉터리 생성 (볼륨 마운트 전 기본 디렉터리)
RUN mkdir -p /repo/apps/api/uploads

WORKDIR /repo/apps/api

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/main"]
