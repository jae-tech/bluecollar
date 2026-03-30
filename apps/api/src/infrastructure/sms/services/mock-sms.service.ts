import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ISmsService } from '../interfaces/sms-service.interface';

/**
 * Mock SMS 발송 서비스 (콘솔 로깅)
 *
 * 개발 환경에서 사용되는 구현입니다.
 * 실제 SMS를 발송하지 않고 콘솔에 로그를 출력합니다.
 * 프로덕션에서는 RealSmsService로 교체됩니다.
 */
@Injectable()
export class MockSmsService implements ISmsService {
  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(MockSmsService.name);
    }
  }

  /**
   * 인증번호를 콘솔에 로깅 (실제 SMS 발송 없음)
   *
   * @param phoneNumber 휴대폰 번호
   * @param code 인증번호
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    this.logger.info({ phoneNumber, code }, '인증번호 발송 (Mock - 콘솔 로깅)');

    // 콘솔에 보기 좋게 출력
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📱 SMS 인증번호 (Mock)`);
    console.log(`${'='.repeat(50)}`);
    console.log(`수신자: ${phoneNumber}`);
    console.log(`인증번호: ${code}`);
    console.log(`메시지: [BlueCollar] 인증번호는 ${code}입니다`);
    console.log(`유효시간: 10분`);
    console.log(`${'='.repeat(50)}\n`);
  }
}
