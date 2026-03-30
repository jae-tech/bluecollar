/**
 * JWT 토큰에서 추출한 사용자 정보 타입
 *
 * request.user에 설정되는 타입입니다.
 * JWT Strategy와 CurrentUser 데코레이터에서 사용됩니다.
 */
export interface UserPayload {
  /** 사용자 UUID */
  id: string;

  /** 사용자 이메일 */
  email: string;

  /** 사용자 역할 */
  role: 'ADMIN' | 'WORKER' | 'CLIENT';

  /** 계정 상태 */
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

  /** 인증 제공자 */
  provider: 'local' | 'google' | 'kakao';

  /** 이메일 인증 여부 */
  emailVerified: boolean;

  /** 휴대폰 인증 여부 */
  phoneVerified: boolean;

  /** 워커 프로필 ID (WORKER 역할만 존재) */
  workerProfileId?: string;
}
