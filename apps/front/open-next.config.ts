import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  dangerous: {
    // App Router only 프로젝트에서 pages-manifest.json 없음 → ISR/태그 캐시 불필요
    disableIncrementalCache: true,
    disableTagCache: true,
  },
});
