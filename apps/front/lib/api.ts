/**
 * API 클라이언트
 *
 * fetch 기반 API 호출 유틸리티.
 * withCredentials 역할: `credentials: 'include'`로 httpOnly 쿠키 자동 전송.
 * 401 응답 시 /auth/refresh를 호출하여 토큰을 자동 갱신합니다.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * 기본 fetch 래퍼 (쿠키 자동 포함)
 */
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401) {
    // 토큰 만료 시 refresh 시도
    const refreshed = await tryRefresh()
    if (refreshed) {
      // 재시도
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      if (!retryRes.ok) {
        // refresh 후에도 실패 → 로그인 페이지로
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new ApiError(retryRes.status, '인증이 만료되었습니다')
      }
      return retryRes.json() as Promise<T>
    } else {
      // refresh 실패 → 로그인 페이지로
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiError(401, '인증이 만료되었습니다')
    }
  }

  if (!res.ok) {
    let message = '요청 처리 중 오류가 발생했습니다'
    try {
      const data = await res.json()
      message = data.message || message
    } catch {}
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface EmailSignupPayload {
  realName: string
  email: string
  password: string
  agreeTerms: true
}

export interface EmailSignupResponse {
  message: string
  email: string
  code?: string // 개발 환경에서만 반환
}

export interface VerifyEmailPayload {
  email: string
  code: string
  type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
}

export interface VerifyEmailResponse {
  message: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user?: {
    id: string
    email: string
    role: string
    status: string
    emailVerified: boolean
  }
  requiresEmailVerification?: boolean
  email?: string
}

export interface WorkerProfile {
  id: string
  slug: string
  businessName: string
  yearsOfExperience?: number
  careerSummary?: string
}

export interface CompleteOnboardingPayload {
  slug: string
  businessName: string
  fieldCodes: string[]
  yearsOfExperience?: number
  careerSummary?: string
  areaCodes?: string[]
}

/** 이메일+비밀번호로 회원가입 (INACTIVE 계정 생성 + 인증 메일 발송) */
export async function emailSignup(payload: EmailSignupPayload): Promise<EmailSignupResponse> {
  return apiFetch('/auth/email-signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 6자리 코드로 이메일 인증 완료 → 자동 로그인 (Set-Cookie) */
export async function verifyEmailCode(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  return apiFetch('/auth/verify-email-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 인증 이메일 재발송 */
export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/resend-verification-email', {
    method: 'POST',
    body: JSON.stringify({ email, type: 'SIGNUP' }),
  })
}

/** 이메일+비밀번호 로그인 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** 로그아웃 */
export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}

/** 현재 로그인한 사용자의 워커 프로필 조회 (없으면 null) */
export async function getMyWorkerProfile(): Promise<WorkerProfile | null> {
  try {
    return await apiFetch<WorkerProfile>('/workers/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

/** 온보딩 완료 후 워커 프로필 저장 */
export async function completeOnboarding(
  payload: CompleteOnboardingPayload,
): Promise<WorkerProfile> {
  return apiFetch('/workers/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
