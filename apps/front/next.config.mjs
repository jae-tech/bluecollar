import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 개발 서버(`next dev`)에서 Cloudflare 바인딩 시뮬레이션 활성화
initOpenNextCloudflareForDev();

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
  // pnpm 모노레포 환경에서 outputFileTracing이 workspace root를 올바르게 탐색하도록 설정
  // OpenNext가 NEXT_PRIVATE_OUTPUT_TRACE_ROOT로 자동 주입하므로 중복 설정하지 않음
  // outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
