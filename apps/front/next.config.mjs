import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { fileURLToPath } from "node:url";
import path from "node:path";

// 개발 서버(`next dev`)에서 Cloudflare 바인딩 시뮬레이션 활성화
initOpenNextCloudflareForDev();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Cloudflare Workers는 자체 Image Optimization API가 없으므로 unoptimized 유지
    unoptimized: true,
  },
  turbopack: {
    // pnpm workspace 환경에서 Turbopack이 workspace root를 잘못 추론하는 버그 방지
    root: __dirname,
  },
};

export default nextConfig;
