/**
 * API 클라이언트
 *
 * fetch 기반 API 호출 유틸리티.
 * withCredentials 역할: `credentials: 'include'`로 httpOnly 쿠키 자동 전송.
 * 401 응답 시 /auth/refresh를 호출하여 토큰을 자동 갱신합니다.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * 기본 fetch 래퍼 (쿠키 자동 포함)
 *
 * @param skipAutoRedirect true 시 401 응답에서 /login 자동 이동 생략 (인증 상태 조회 등)
 */
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  skipAutoRedirect = false,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (skipAutoRedirect) {
      throw new ApiError(401, "인증이 필요합니다");
    }
    // 토큰 만료 시 refresh 시도
    const refreshed = await tryRefresh();
    if (refreshed) {
      // 재시도
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!retryRes.ok) {
        // refresh 후에도 실패 → 로그인 페이지로
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError(retryRes.status, "인증이 만료되었습니다");
      }
      return retryRes.json() as Promise<T>;
    } else {
      // refresh 실패 → 로그인 페이지로
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "인증이 만료되었습니다");
    }
  }

  if (!res.ok) {
    let message = "요청 처리 중 오류가 발생했습니다";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface EmailSignupPayload {
  realName: string;
  email: string;
  password: string;
  agreeTerms: true;
}

export interface EmailSignupResponse {
  message: string;
  email: string;
  code?: string; // 개발 환경에서만 반환
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
  type: "SIGNUP" | "PASSWORD_RESET" | "EMAIL_CHANGE";
}

export interface VerifyEmailResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
    emailVerified: boolean;
  };
  requiresEmailVerification?: boolean;
  email?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

export interface WorkerProfile {
  id: string;
  slug: string;
  businessName: string;
  yearsOfExperience?: number;
  careerSummary?: string;
  fields?: { fieldCode: string }[];
}

export interface CompleteOnboardingPayload {
  slug?: string;
  businessName: string;
  fieldCodes: string[];
  yearsOfExperience?: number;
  careerSummary?: string;
  areaCodes?: string[];
}

/** 이메일+비밀번호로 회원가입 (INACTIVE 계정 생성 + 인증 메일 발송) */
export async function emailSignup(
  payload: EmailSignupPayload,
): Promise<EmailSignupResponse> {
  return apiFetch("/auth/email-signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 6자리 코드로 이메일 인증 완료 → 자동 로그인 (Set-Cookie) */
export async function verifyEmailCode(
  payload: VerifyEmailPayload,
): Promise<VerifyEmailResponse> {
  return apiFetch("/auth/verify-email-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 인증 이메일 재발송 */
export async function resendVerificationEmail(
  email: string,
): Promise<{ message: string }> {
  return apiFetch("/auth/resend-verification-email", {
    method: "POST",
    body: JSON.stringify({ email, type: "SIGNUP" }),
  });
}

/** 이메일+비밀번호 로그인 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 현재 로그인한 사용자 정보 조회 (미인증 시 null, 자동 redirect 없음) */
export async function getMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>("/auth/me", {}, true);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403))
      return null;
    throw err;
  }
}

/** 로그아웃 */
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

/** 현재 로그인한 사용자의 워커 프로필 조회 (없으면 null) */
export async function getMyWorkerProfile(): Promise<WorkerProfile | null> {
  try {
    return await apiFetch<WorkerProfile>("/workers/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** 온보딩 완료 후 워커 프로필 저장 (완료 후 /auth/refresh 자동 호출) */
export async function completeOnboarding(
  payload: CompleteOnboardingPayload,
): Promise<WorkerProfile> {
  const profile = await apiFetch<WorkerProfile>("/workers/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // 프로필 생성 후 액세스 토큰 갱신 (워커 role 반영)
  await tryRefresh();
  return profile;
}

// ─── Public Profile ──────────────────────────────────────────────────────────

export interface PublicProfileMedia {
  id: string;
  mediaUrl: string;
  mediaType: string;
  imageType: string | null;
  videoDuration: number | null;
  thumbnailUrl: string | null;
  displayOrder: number;
  description: string | null;
}

export interface PublicProfilePortfolio {
  id: string;
  title: string;
  content: string | null;
  startDate: string | null;
  endDate: string | null;
  difficulty: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  costVisibility: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  media: PublicProfileMedia[];
}

export interface PublicProfile {
  profile: {
    id: string;
    slug: string;
    businessName: string;
    profileImageUrl: string | null;
    description: string | null;
    careerSummary: string | null;
    yearsOfExperience: number | null;
    businessVerified: boolean;
    officeAddress: string | null;
    officeCity: string | null;
    officeDistrict: string | null;
    officePhoneNumber: string | null;
    operatingHours: string | null;
    officeImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    realName: string;
    role: string;
  } | null;
  fields: { fieldCode: string }[];
  areas: { areaCode: string }[];
  portfolios: PublicProfilePortfolio[];
}

/** 공개 워커 프로필 조회 (slug 기반, 토큰 불필요) */
export async function getPublicProfile(
  slug: string,
): Promise<PublicProfile | null> {
  try {
    return await apiFetch<PublicProfile>(
      `/public/profiles/${encodeURIComponent(slug)}`,
      {},
      true,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ─── Codes ───────────────────────────────────────────────────────────────────

export interface MasterCode {
  code: string;
  group: string;
  name: string;
  sortOrder: number;
}

export interface OnboardingCodes {
  fields: MasterCode[];
  expLevels: MasterCode[];
  bizTypes: MasterCode[];
}

/** 그룹별 마스터 코드 목록 조회 (토큰 불필요) */
export async function getCodes(group: string): Promise<MasterCode[]> {
  return apiFetch<MasterCode[]>(
    `/codes?group=${encodeURIComponent(group)}`,
    {},
    true,
  );
}

/** 업종별 스킬 태그 조회 (토큰 불필요) */
export async function getSkillTags(fieldCode: string): Promise<MasterCode[]> {
  return apiFetch<MasterCode[]>(
    `/codes/skill-tags?fieldCode=${encodeURIComponent(fieldCode)}`,
    {},
    true,
  );
}

/** 온보딩용 코드 일괄 조회 (FIELD + EXP + BIZ, 토큰 불필요) */
export async function getOnboardingCodes(): Promise<OnboardingCodes> {
  return apiFetch<OnboardingCodes>("/codes/onboarding", {}, true);
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * slug 사용 가능 여부 확인
 * - 예약어 + DB 중복 체크
 * - 조회수 증가 없음 (전용 엔드포인트)
 * @returns true = 사용 가능, false = 사용 불가 (예약어 또는 중복)
 */
// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  filename: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

/** 파일 업로드 (multipart/form-data) → S3/로컬 URL 반환 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/media/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    let message = "파일 업로드 중 오류가 발생했습니다";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<UploadResult>;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface CreatePortfolioMediaPayload {
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "PDF";
  imageType?: "BEFORE" | "AFTER" | "DETAIL" | "BLUEPRINT";
  description?: string;
}

export interface CreatePortfolioPayload {
  workerProfileId: string;
  title: string;
  content?: string;
  startDate?: string;
  endDate?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  estimatedCost?: number;
  actualCost?: number;
  costVisibility?: "PUBLIC" | "PRIVATE";
  media: CreatePortfolioMediaPayload[];
}

/** 포트폴리오 생성 */
export async function createPortfolio(
  payload: CreatePortfolioPayload,
): Promise<PublicProfilePortfolio> {
  return apiFetch<PublicProfilePortfolio>("/portfolios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 포트폴리오 삭제 */
export async function deletePortfolio(id: string): Promise<void> {
  return apiFetch<void>(`/portfolios/${id}`, { method: "DELETE" });
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const result = await apiFetch<{ available: boolean; reason?: string }>(
    `/public/profiles/slug-check?slug=${encodeURIComponent(slug)}`,
    {},
    true,
  );
  return result.available;
}
