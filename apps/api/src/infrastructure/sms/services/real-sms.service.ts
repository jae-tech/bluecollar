import { Injectable, NotImplementedException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ISmsService } from '../interfaces/sms-service.interface';

/**
 * 실제 SMS API 서비스 (구현 대기 중)
 *
 * 프로덕션 환경에서 사용될 서비스입니다.
 * 현재는 NotImplementedException을 throw합니다.
 * 아래 주석된 예시를 참고하여 구현하면 됩니다.
 *
 * 지원 예정 SMS 제공자:
 * - Coolsms (국내 - 권장)
 * - Twilio (국제)
 * - AWS SNS
 */
@Injectable()
export class RealSmsService implements ISmsService {
  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(RealSmsService.name);
    }
  }

  /**
   * 인증번호를 SMS로 발송 (실제 API 호출)
   *
   * @param phoneNumber 휴대폰 번호
   * @param code 인증번호
   * @throws NotImplementedException - 아직 구현되지 않음
   *
   * @example
   * // Coolsms 구현 예시:
   * const response = await this.coolsmsClient.sendOne({
   *   to: phoneNumber,
   *   from: process.env.COOLSMS_FROM_NUMBER,
   *   text: `[BlueCollar] 인증번호는 ${code}입니다. 10분 유효.`,
   * });
   *
   * @example
   * // Twilio 구현 예시:
   * const message = await this.twilioClient.messages.create({
   *   body: `[BlueCollar] Your verification code is: ${code}. Valid for 10 minutes.`,
   *   from: process.env.TWILIO_PHONE_NUMBER,
   *   to: phoneNumber,
   * });
   *
   * @example
   * // AWS SNS 구현 예시:
   * const response = await this.snsClient.publish({
   *   Message: `[BlueCollar] 인증번호는 ${code}입니다. 10분 유효.`,
   *   PhoneNumber: phoneNumber,
   * }).promise();
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    this.logger.warn(
      {
        phoneNumber,
        provider: process.env.SMS_PROVIDER,
      },
      'SMS 발송 시도 - 실제 구현 대기 중',
    );

    const provider = process.env.SMS_PROVIDER || 'unknown';

    throw new NotImplementedException(
      `SMS 서비스 구현이 아직 완료되지 않았습니다. ` +
        `구성된 제공자: ${provider}. ` +
        `src/infrastructure/sms/services/real-sms.service.ts를 참고하여 구현하세요.`,
    );

    // 구현 예시 (Coolsms):
    // try {
    //   const response = await this.coolsmsClient.sendOne({
    //     to: phoneNumber,
    //     from: process.env.SMS_COOLSMS_FROM_NUMBER,
    //     text: `[BlueCollar] 인증번호는 ${code}입니다. 10분 유효.`,
    //   });
    //
    //   this.logger.info(
    //     { phoneNumber, messageId: response.message_id },
    //     'SMS 발송 성공',
    //   );
    // } catch (error) {
    //   this.logger.error(
    //     { phoneNumber, error: (error as Error).message },
    //     'SMS 발송 실패',
    //   );
    //   throw new InternalServerErrorException('SMS 발송에 실패했습니다');
    // }
  }
}
