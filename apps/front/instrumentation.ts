/**
 * Next.js Instrumentation Hook
 *
 * Cloudflare Workers(OpenNext) 환경에서 서버 런타임(edge/nodejs)에서는
 * @sentry/nextjs 서버 기능을 활성화하지 않습니다.
 * 클라이언트 사이드 Sentry는 sentry.client.config.ts에서 초기화됩니다.
 */
export async function register() {
  // Cloudflare Workers 런타임에서는 서버 사이드 Sentry 초기화 생략
  // (Node.js 전용 API 미지원으로 런타임 오류 발생 방지)
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    await import("@sentry/nextjs").then(({ init }) => {
      init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      });
    });
  }
}
