/**
 * 이메일 서비스 인터페이스
 *
 * Mock과 Nodemailer 등 다양한 이메일 제공자를 추상화합니다.
 * SMS_PROVIDER 환경 변수로 구현체를 선택할 수 있습니다.
 */
export interface IEmailService {
  /**
   * 이메일 인증 코드 발송
   *
   * @param email 대상 이메일
   * @param code 인증 코드 (6자리 또는 UUID)
   * @param type 인증 타입 ('SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE')
   */
  sendVerificationEmail(
    email: string,
    code: string,
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): Promise<void>;

  /**
   * 비밀번호 재설정 링크 발송
   *
   * @param email 대상 이메일
   * @param resetLink 재설정 링크 (토큰 포함)
   */
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;

  /**
   * 순환 상태 확인 (헬스 체크)
   *
   * SMTP 연결 등이 정상인지 확인합니다.
   */
  isHealthy(): Promise<boolean>;
}
