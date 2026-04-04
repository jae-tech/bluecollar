import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 개발 서버(`next dev`)에서 Cloudflare 바인딩 시뮬레이션 활성화
initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모노레포 workspace 패키지 트랜스파일 (TypeScript 소스 직접 참조)
  transpilePackages: ["@repo/constants"],
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
  // 반드시 상대 경로 문자열로 지정 (절대 경로 사용 시 Next.js가 올바르게 해석하지 못함)
  turbopack: {
    root: "../..",
  },
  // pnpm 모노레포 환경에서 outputFileTracing이 workspace root를 올바르게 탐색하도록 설정
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
