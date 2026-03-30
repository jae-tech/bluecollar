/**
 * SMS 발송 서비스 인터페이스
 *
 * 다양한 SMS 제공자(Twilio, AWS SNS, 국내 API 등)를
 * 구현할 수 있도록 하는 추상 인터페이스
 */
export interface ISmsService {
  /**
   * 인증번호를 SMS로 발송
   * @param phoneNumber 휴대폰 번호 (e.g. "01012345678")
   * @param code 인증번호 (e.g. "123456")
   */
  sendVerificationCode(phoneNumber: string, code: string): Promise<void>;
}
