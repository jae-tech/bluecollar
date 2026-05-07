"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Next.js 전역 에러 바운더리 (App Router)
 *
 * 렌더링 중 발생한 처리되지 않은 에러를 Sentry에 보고합니다.
 * layout.tsx까지 포함한 앱 전체 에러를 캡처합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            문제가 발생했습니다
          </p>
          <p className="text-sm text-gray-500 mb-6">
            오류가 자동으로 보고되었습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-md bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
