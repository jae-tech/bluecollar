/**
 * 예약어 slug 리스트
 *
 * 이 리스트에 포함된 slug는 워커가 등록할 수 없습니다.
 * 시스템 라우팅 충돌, 보안, 운영 편의성을 위해 정의됩니다.
 */
export const RESERVED_SLUGS = [
  // 시스템 & 인증
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'logout',
  'me',
  'account',

  // 정적 리소스
  'public',
  'static',
  'assets',
  'media',
  'uploads',
  'files',
  'images',
  'videos',

  // 문서 & API
  'docs',
  'swagger',
  'api-docs',
  'documentation',
  'help',

  // 커뮤니티
  'support',
  'contact',
  'feedback',

  // 법정 공시
  'about',
  'terms',
  'privacy',
  'cookie',
  'legal',

  // 기술 & 운영
  'health',
  'status',
  'metrics',
  'debug',
  'test',
  'www',

  // 메일 관련
  'mail',
  'email',
  'mailer',
  'smtp',

  // API 리소스
  'workers',
  'portfolios',
  'profiles',
  'search',
  'explore',
  'featured',
  'trending',
  'categories',
  'tags',

  // 사용자 관련
  'user',
  'users',
  'member',
  'members',
  'client',
  'clients',

  // 검색 & 필터
  'filter',
  'filters',
  'sort',
  'results',

  // 페이지
  'home',
  'index',
  'page',
  'pages',
  '404',
  '500',

  // 기타 예약어
  'wp-admin',
  'xmlrpc.php',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
] as const;

/**
 * slug이 예약어인지 확인합니다.
 *
 * @param slug - 확인할 slug
 * @returns 예약어이면 true
 *
 * @example
 * isSlugReserved('admin') // true
 * isSlugReserved('ADMIN') // true (case-insensitive)
 * isSlugReserved('admin-plumbing') // false (prefix 사용은 가능)
 */
export function isSlugReserved(slug: string): boolean {
  const normalizedSlug = slug.toLowerCase();
  return RESERVED_SLUGS.includes(normalizedSlug as any);
}
