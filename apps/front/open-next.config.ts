import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

export default {
  ...cloudflareConfig,
  // App Router only 프로젝트 — pages-manifest.json 없으므로 ISR/태그 캐시 비활성화
  dangerous: {
    ...cloudflareConfig.dangerous,
    disableIncrementalCache: true,
    disableTagCache: true,
  },
};
