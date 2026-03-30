import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { PinoLogger } from 'nestjs-pino';
import { MockSmsService } from './services/mock-sms.service';
import { RealSmsService } from './services/real-sms.service';
import { ISmsService } from './interfaces/sms-service.interface';

/**
 * SMS 인프라 모듈
 *
 * SMS 발송 기능을 제공하는 모듈입니다.
 * 환경 변수 SMS_PROVIDER에 따라 Mock 또는 실제 SMS 서비스를 사용합니다.
 *
 * 의존성:
 * - LoggerModule: SMS 서비스에서 로깅을 위해 필요
 *
 * 의존성 규칙:
 * - 도메인 계층 (domains/) → infrastructure 계층 ✓
 * - infrastructure 계층 → 도메인 계층 ✗ (순환 참조 방지)
 *
 * @example
 * // 모듈 사용
 * constructor(
 *   @Inject('SMS_SERVICE') private readonly smsService: ISmsService,
 * ) {}
 *
 * @example
 * // 환경 변수 설정
 * SMS_PROVIDER=mock      # 개발: 콘솔 로깅
 * SMS_PROVIDER=coolsms   # 프로덕션: 실제 SMS API (미구현)
 */
@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: 'SMS_SERVICE',
      useFactory: (logger: PinoLogger): ISmsService => {
        const provider = process.env.SMS_PROVIDER || 'mock';

        logger.info({ provider }, 'SMS 서비스 로드');

        switch (provider) {
          case 'mock':
            return new MockSmsService(logger);

          case 'coolsms':
          case 'twilio':
          case 'aws-sns':
            // 모든 실제 SMS 제공자는 RealSmsService로 통일
            // RealSmsService 내부에서 provider별 처리
            return new RealSmsService(logger);

          default:
            // 알 수 없는 제공자는 mock 사용
            logger.warn({ provider }, '알 수 없는 SMS 제공자, mock 사용');
            return new MockSmsService(logger);
        }
      },
      inject: [PinoLogger],
    },
  ],
  exports: ['SMS_SERVICE'],
})
export class SmsModule {}
