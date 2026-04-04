# Cloudflare Workers 배포 트러블슈팅 회고록

**프로젝트:** bluecollar (Next.js 16.2.2 + OpenNext Cloudflare 1.18.0 + pnpm 모노레포)
**기간:** 2026년 4월
**배포 환경:** Cloudflare Workers Builds (GitHub 연동 자동 배포)

---

## 개요

Next.js 16.2.2 앱을 Cloudflare Workers에 배포하는 과정에서 7개의 서로 다른 에러를 순차적으로 마주쳤다. 각 에러는 이전 에러를 해결하면서 드러났고, 일부는 Next.js 16과 OpenNext 1.18.0 조합의 미보고 버그였다.

---

## 문제 1: Node.js Middleware 미지원

### 에러
```
ERROR Node.js middleware is not currently supported.
Consider switching to Edge Middleware.
```

### 원인
Next.js 16에서 Middleware 파일명 규칙이 바뀌었다.

| 파일명 | 종류 | Cloudflare 지원 |
|--------|------|----------------|
| `middleware.ts` | Edge Middleware | O |
| `proxy.ts` | Node.js Middleware (Next.js 16 신규) | X |

인증 가드를 `proxy.ts`로 작성했는데, 이것이 Node.js 런타임에서만 동작하는 새로운 Middleware 방식이었다. Cloudflare Workers는 Node.js 런타임을 지원하지 않으므로 영구적으로 미지원.

### 해결
`proxy.ts` → `middleware.ts`로 rename, 함수명 `proxy` → `middleware`로 변경.

```ts
// middleware.ts (Edge Middleware — Cloudflare 지원)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  // 인증 가드 로직...
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|icons/|auth/).*)" ],
};
```

**참고:** Next.js 16에서 `middleware.ts`는 deprecated 경고가 뜨지만 Edge Middleware로 정상 동작한다. `proxy.ts` 지원은 OpenNext Adapters API 구현 이후 예정.

---

## 문제 2: pages-manifest.json ENOENT

### 에러
```
ENOENT: no such file or directory, open
'.next/standalone/.next/server/pages-manifest.json'
```

### 원인
App Router만 사용하는 프로젝트에는 `pages-manifest.json`이 생성되지 않는다. 그런데 `@opennextjs/aws` 내부의 `getHtmlPages()` 함수가 예외 처리 없이 `readFileSync`로 이 파일을 읽으려 했다.

### 해결
`open-next.config.ts`에 `dangerous` 옵션으로 Incremental Cache와 Tag Cache를 비활성화.

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

export default {
  ...cloudflareConfig,
  dangerous: {
    ...cloudflareConfig.dangerous,
    disableIncrementalCache: true,
    disableTagCache: true,
  },
};
```

**핵심:** `defineCloudflareConfig()`는 `dangerous` 파라미터를 직접 받지 않는다. 반환값을 spread한 후 `dangerous`를 별도로 주입해야 한다.

---

## 문제 3: Workers Builds Root Directory 설정 오류

### 에러
```
ENOENT: no such file or directory,
scandir '/opt/buildhome/repo/apps/front/.next/standalone/.next'
```

### 원인
Cloudflare Workers Builds의 Root Directory를 `/`로 설정했더니 `opennextjs-cloudflare build`가 레포 루트에서 실행되었다. OpenNext는 실행 위치를 기준으로 `packagePath`를 계산하는데, 루트에서 실행하면 `packagePath = ""`가 되어 standalone 경로를 잘못 인식했다.

### 해결
Workers Builds 설정 변경:
- Root directory: **비워둠** (레포 루트가 기준)
- Build command: `cd apps/front && pnpm run build:cf`
- Deploy command: `cd apps/front && pnpm run deploy`

---

## 문제 4: standalone 디렉토리 미생성

### 에러
```
ENOENT: no such file or directory,
scandir '/opt/buildhome/repo/apps/front/.next/standalone/.next'
```
(Root Directory 수정 후에도 동일한 에러 지속)

### 원인
Next.js 16 + Turbopack + `middleware.ts` 조합에서 `output: "standalone"` 설정에도 `.next/standalone` 디렉토리가 생성되지 않는 버그 (vercel/next.js#91600).

Turbopack이 middleware.ts를 처리하는 과정에서 standalone 복사 단계를 건너뛰는 것으로 확인됨.

### 해결
`apps/front/next.config.mjs`에 `output: "standalone"` 명시적 추가.

```js
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  output: "standalone",  // 명시적으로 추가
  images: { unoptimized: true },
  turbopack: { root: "../.." },
  outputFileTracingRoot: path.join(__dirname, "../../"),
};
```

---

## 문제 5: Turbopack 루트 경로 인식 오류

### 에러
```
Turbopack build failed: couldn't find Next.js package from apps/front/app
```

### 원인
pnpm 모노레포에서 Turbopack이 프로젝트 루트를 올바르게 인식하지 못했다. `apps/front/app`을 프로젝트 디렉토리로 잘못 인식하여 Next.js 패키지를 찾지 못했다.

추가로 `apps/front/pnpm-lock.yaml`이 별도 lock 파일로 존재하여 Turbopack이 workspace root를 잘못 추론하고, Next.js 16.1.6이 로드되는 문제도 있었다.

### 해결

**1. `next.config.mjs`에 Turbopack root 명시:**
```js
turbopack: {
  root: "../..",  // 상대 경로 문자열 — 절대 경로 X
},
```

**주의:** `path.join(__dirname, "../../")`처럼 절대 경로로 계산하면 실행 컨텍스트에 따라 경로가 달라질 수 있다. 반드시 상대 경로 문자열을 사용해야 한다.

**2. 스트레이 lock 파일 제거:**
```bash
git rm apps/front/pnpm-lock.yaml
```

`apps/front`에 별도 lock 파일이 있으면 Turbopack이 이 디렉토리를 독립적인 workspace로 인식하여 모노레포 루트 대신 여기서 패키지를 탐색한다.

---

## 문제 6: esbuild Node.js 모듈 미지원

### 에러
```
Could not resolve "./node-environment"
Could not resolve "./node-polyfill-crypto"
```

### 원인
OpenNext의 esbuild가 `conditions: ["workerd"]`로 번들링할 때 Next.js 16.2.2의 `next-server.js`가 참조하는 Node.js 전용 내부 모듈을 해석하지 못했다.

Next.js 16.2.2와 OpenNext 1.18.0 조합의 **미보고 호환성 버그**. OpenNext 1.18.0은 Next.js 16.2.2를 공식 지원하지 않는 시점이었다.

### 해결
`pnpm patch`로 `@opennextjs/cloudflare@1.18.0`에 빈 shim alias를 추가.

**패치 파일 생성 (`patches/@opennextjs__cloudflare@1.18.0.patch`):**
```diff
+            "next/dist/server/node-environment": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
+            "next/dist/server/node-polyfill-crypto": path.join(buildOpts.outputDir, "cloudflare-templates/shims/empty.js"),
```

**루트 `package.json`에 패치 등록:**
```json
"pnpm": {
  "patchedDependencies": {
    "@opennextjs/cloudflare@1.18.0": "patches/@opennextjs__cloudflare@1.18.0.patch"
  }
}
```

이 패치는 Worker 환경에서 실행되지 않는 Node.js 전용 모듈을 빈 모듈로 shimming하여 esbuild가 번들링을 완료할 수 있게 한다.

---

## 문제 7: 배포 명령어 혼동

### 에러
```
ERROR Could not find compiled Open Next config, did you run the build command?
```

### 원인
Workers Builds의 Deploy command를 `npx @opennextjs/cloudflare deploy`로 설정했는데, 이 명령어는 빌드와 배포를 같이 수행하려 했다. 이미 Build command에서 빌드가 완료된 상태에서 다시 빌드를 시도하면 컴파일된 설정 파일을 찾지 못한다.

### 해결
빌드와 배포를 완전히 분리.

**`apps/front/package.json`:**
```json
"scripts": {
  "build": "next build",
  "build:cf": "opennextjs-cloudflare build",
  "deploy": "wrangler deploy"
}
```

**Workers Builds 설정:**
- Build command: `cd apps/front && pnpm run build:cf`
- Deploy command: `cd apps/front && pnpm run deploy`

`build:cf`는 OpenNext 번들링만 담당하고, `deploy`는 `wrangler deploy`로 이미 번들링된 결과물을 Cloudflare에 업로드하는 역할만 한다.

---

## 최종 파일 상태

### `apps/front/next.config.mjs`
```js
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "node:path";
import { fileURLToPath } from "node:url";

initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  images: { unoptimized: true },
  turbopack: { root: "../.." },
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
```

### `apps/front/open-next.config.ts`
```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

export default {
  ...cloudflareConfig,
  dangerous: {
    ...cloudflareConfig.dangerous,
    disableIncrementalCache: true,
    disableTagCache: true,
  },
};
```

### `apps/front/package.json` (scripts 부분)
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build:cf": "opennextjs-cloudflare build",
  "preview": "opennextjs-cloudflare preview",
  "deploy": "wrangler deploy",
  "start": "next start",
  "lint": "eslint ."
}
```

### Workers Builds 대시보드 설정
| 항목 | 값 |
|------|-----|
| Root directory | (비어있음) |
| Build command | `cd apps/front && pnpm run build:cf` |
| Deploy command | `cd apps/front && pnpm run deploy` |

---

## 핵심 교훈

1. **Next.js 16의 Middleware 이분화**: `middleware.ts` (Edge) vs `proxy.ts` (Node.js). Cloudflare는 `proxy.ts` 영구 미지원.

2. **OpenNext `defineCloudflareConfig()`의 spread 패턴**: 반환값을 직접 수정하지 말고 spread 후 오버라이드.

3. **pnpm 모노레포에서 Turbopack root는 상대 경로 문자열로**: 절대 경로 계산은 실행 컨텍스트에 따라 결과가 달라진다.

4. **스트레이 lock 파일은 즉시 제거**: 서브 디렉토리의 `pnpm-lock.yaml`은 Turbopack의 workspace 탐색을 방해한다.

5. **빌드와 배포는 명확히 분리**: Workers Builds의 Build/Deploy 단계는 독립적으로 실행되므로 스크립트도 분리해야 한다.

6. **버전 고정 + 패치가 다운그레이드보다 낫다**: 패키지 다운그레이드 대신 `pnpm patch`로 호환성 버그를 직접 수정하면 최신 버전을 유지하면서 안정성을 확보할 수 있다.
