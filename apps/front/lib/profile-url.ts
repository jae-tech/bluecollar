/**
 * 워커 프로필 공개 URL을 환경에 맞게 반환한다.
 *
 * - 프로덕션: `https://{slug}.bluecollar.cv` (서브도메인 방식)
 * - 로컬 dev: `http://localhost:3000/worker/{slug}` (경로 방식)
 *
 * NEXT_PUBLIC_APP_URL이 `http://localhost` 또는 `http://127.0.0.1`로 시작하거나
 * 설정되지 않은 경우(NODE_ENV=development 가정) 로컬 URL을 반환한다.
 */
export function getProfileUrl(slug: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // localhost 또는 127.0.0.1 → 개발 환경
  const isLocal =
    !appUrl ||
    appUrl.startsWith("http://localhost") ||
    appUrl.startsWith("http://127.0.0.1");

  if (isLocal) {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    return `${base}/worker/${slug}`;
  }

  // 프로덕션: appUrl에서 도메인만 추출
  // NEXT_PUBLIC_APP_URL = "https://bluecollar.cv" → slug.bluecollar.cv
  const domain = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${slug}.${domain}`;
}
