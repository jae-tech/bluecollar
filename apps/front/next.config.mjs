import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 개발 서버(`next dev`)에서 Cloudflare 바인딩 시뮬레이션 활성화
initOpenNextCloudflareForDev();

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
    root: "../..",
  },
};

export default nextConfig;
