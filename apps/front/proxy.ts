import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 인증이 필요한 경로 목록
 * httpOnly 쿠키 존재 여부로 1차 가드 (실제 유효성은 API 호출 시 401로 확인)
 */
const PROTECTED_PATHS = ["/onboarding", "/dashboard"];

/**
 * 미인증 유저 전용 경로 (로그인 상태면 리다이렉트)
 */
const AUTH_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // accessToken 쿠키 존재 여부 확인
  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthenticated = !!accessToken;

  // 인증 필요 경로 → 미인증 시 /login 리다이렉트
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 미인증 전용 경로 → 인증 상태면 홈으로 리다이렉트
  const isAuthOnly = AUTH_PATHS.some((path) => pathname.startsWith(path));
  if (isAuthOnly && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로는 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - public 폴더 파일
     * - /auth/verify-email (미인증 유저 전용이므로 보호 불필요)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|icons/|auth/).*)",
  ],
};
