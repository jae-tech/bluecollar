import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      // Cloudflare KV 기반 incremental cache (선택사항 — 추후 KV 바인딩 추가 시 활성화)
      // incrementalCache: 'fetch',
      // tagCache: 'dummy',
      // queue: 'dummy',
    },
  },
};

export default config;
