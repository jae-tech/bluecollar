/**
 * Sentry 클라이언트 사이드 초기화
 *
 * Next.js + Cloudflare Workers(OpenNext) 환경:
 * - 서버 사이드(Workers 런타임)에서는 Node.js API 미지원으로 @sentry/nextjs 서버 기능 제외
 * - 클라이언트 사이드에서만 브라우저 에러 캡처 활성화
 *
 * 이 파일은 Next.js가 자동으로 클라이언트 번들에 포함합니다.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // 브라우저 세션의 10% 트레이스 샘플링 (프로덕션 기준)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // 재현율 낮은 에러를 놓치지 않기 위해 replays 비활성화 (개인정보 보호)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // 개발 환경에서 Sentry 이벤트 콘솔 출력 (디버깅용)
    debug: process.env.NODE_ENV === "development",

    // 알려진 무시 에러 패턴 (브라우저 확장, 봇 등)
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      /^NetworkError/,
      /^ChunkLoadError/,
    ],
  });
}
