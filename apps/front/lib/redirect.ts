import type { WorkerProfile } from "@/lib/api";

/**
 * workerProfile 유무에 따라 리다이렉트 경로를 반환합니다.
 * - 프로필 있음: /worker/:slug (프로필 페이지)
 * - 프로필 없음: /onboarding/slug (slug 설정 페이지)
 */
export function getRedirectPath(workerProfile: WorkerProfile | null): string {
  if (workerProfile) {
    return `/worker/${workerProfile.slug}`;
  }
  return "/onboarding/slug";
}
