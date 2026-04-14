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

/** 프로덕션 apex 도메인 (서브도메인 감지에 사용) */
const APEX_DOMAIN = "bluecollar.cv";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── 서브도메인 감지 ──────────────────────────────────────────────────────────
  // slug.bluecollar.cv 형태의 요청을 /worker/slug 로 rewrite
  // localhost 개발 환경 및 www 서브도메인은 제외
  const isApexOrWww =
    hostname === APEX_DOMAIN ||
    hostname === `www.${APEX_DOMAIN}` ||
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1");

  if (!isApexOrWww && hostname.endsWith(`.${APEX_DOMAIN}`)) {
    const slug = hostname.replace(`.${APEX_DOMAIN}`, "");
    // 빈 slug 또는 잘못된 slug 방어
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/worker/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  // refreshToken 쿠키 존재 여부로 인증 판단.
  // accessToken(15분)이 아닌 refreshToken(30일)을 사용하는 이유:
  // accessToken 만료 후 대시보드 접근 시 미들웨어가 먼저 막아버리면
  // apiFetch의 자동 갱신 로직이 실행될 기회가 없음.
  // refreshToken이 있으면 실제 API 호출 시 accessToken이 자동 갱신됨.
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isAuthenticated = !!refreshToken;

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
