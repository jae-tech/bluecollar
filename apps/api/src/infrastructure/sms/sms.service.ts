import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ISmsService } from './interfaces/sms-service.interface';

/**
 * SMS 발송 서비스
 *
 * 현재는 콘솔 로그로 구현되어 있으며,
 * 추후 실제 SMS API (Twilio, AWS SNS, Coolsms 등)로 대체 가능
 */
@Injectable()
export class SmsService implements ISmsService {
  constructor(private readonly logger: PinoLogger) {
    // Logger가 제대로 주입되었으면 context 설정
    // (Test 환경에서 logger가 없을 수도 있으므로 safe check)
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(SmsService.name);
    }
  }

  /**
   * 인증번호를 SMS로 발송 (현재는 콘솔에 출력)
   *
   * 향후 실제 구현:
   * - Twilio: https://www.twilio.com/
   * - AWS SNS: https://aws.amazon.com/sns/
   * - Coolsms (KR): https://www.coolsms.co.kr/
   * - NexmoAPI: https://www.vonage.com/
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    this.logger.info(
      { phoneNumber, code },
      `[SMS] Sending verification code to ${phoneNumber}`,
    );

    // 실제 구현 예시:
    // try {
    //   const response = await twilioClient.messages.create({
    //     body: `[BlueCollar] Your verification code is: ${code}. Valid for 10 minutes.`,
    //     from: this.config.get('SMS_TWILIO_PHONE_NUMBER'),
    //     to: phoneNumber,
    //   });
    //   this.logger.info({ sid: response.sid }, 'SMS sent successfully');
    // } catch (error) {
    //   this.logger.error(
    //     { error: error.message, phoneNumber },
    //     'Failed to send SMS',
    //   );
    //   throw new InternalServerErrorException('Failed to send SMS');
    // }

    // 현재: 콘솔에 로그만 출력
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📱 SMS Verification Code`);
    console.log(`${'='.repeat(50)}`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Code: ${code}`);
    console.log(`Message: [BlueCollar] Your verification code is: ${code}`);
    console.log(`Valid for: 10 minutes`);
    console.log(`${'='.repeat(50)}\n`);
  }
}
