import { Module } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MockEmailService } from './services/mock-email.service';
import { NodemailerEmailService } from './services/nodemailer-email.service';
import type { IEmailService } from './interfaces/email-service.interface';

/**
 * 이메일 모듈
 *
 * 이메일 서비스를 Factory Pattern으로 관리합니다.
 * EMAIL_SERVICE 환경 변수에 따라 구현체를 선택합니다:
 *
 * - EMAIL_SERVICE=mock (기본값)
 *   → MockEmailService (콘솔 로그만 출력, 개발/테스트용)
 *
 * - EMAIL_SERVICE=nodemailer
 *   → NodemailerEmailService (실제 SMTP로 발송, 프로덕션용)
 *
 * 사용법:
 * @Inject('EMAIL_SERVICE') private emailService: IEmailService
 */
@Module({
  providers: [
    {
      // 🏭 Factory Provider: 환경 변수에 따라 적절한 구현체 선택
      provide: 'EMAIL_SERVICE',
      useFactory: (logger: PinoLogger): IEmailService => {
        const emailService = process.env.EMAIL_SERVICE || 'mock';

        logger.info(
          { emailService },
          '📧 이메일 서비스 선택',
        );

        switch (emailService.toLowerCase()) {
          case 'nodemailer':
            logger.info('🚀 Nodemailer 이메일 서비스 사용 중');
            return new NodemailerEmailService(logger);

          case 'mock':
          default:
            logger.info('🧪 Mock 이메일 서비스 사용 중 (개발 모드)');
            return new MockEmailService(logger);
        }
      },
      inject: [PinoLogger],
    },
  ],
  exports: ['EMAIL_SERVICE'],
})
export class EmailModule {}
