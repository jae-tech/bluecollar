import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 개발 서버(`next dev`)에서 Cloudflare 바인딩 시뮬레이션 활성화
initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // OpenNext Cloudflare 빌드에 필요한 standalone 출력 모드
  output: "standalone",
  images: {
    // Cloudflare Workers는 자체 Image Optimization API가 없으므로 unoptimized 유지
    unoptimized: true,
  },
  // pnpm 모노레포에서 Turbopack이 workspace root를 올바르게 인식하도록 설정
  // next.config.mjs 기준 상대 경로 사용 (apps/front → 두 단계 위 = 모노레포 루트)
  turbopack: {
    root: "../..",
  },
  // pnpm 모노레포 환경에서 outputFileTracing이 workspace root를 올바르게 탐색하도록 설정
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
