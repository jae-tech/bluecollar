import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { IEmailService } from '../interfaces/email-service.interface';

/**
 * Mock 이메일 서비스
 *
 * 개발/테스트 환경에서 실제 이메일을 발송하지 않고
 * 콘솔에 로그만 출력합니다.
 *
 * 환경 변수:
 * - EMAIL_SERVICE=mock
 */
@Injectable()
export class MockEmailService implements IEmailService {
  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(MockEmailService.name);
    }
  }

  /**
   * 이메일 인증 코드 발송 (Mock)
   *
   * 실제로 발송하지 않고 콘솔에 출력합니다.
   * 개발 시 코드를 쉽게 확인할 수 있습니다.
   */
  async sendVerificationEmail(
    email: string,
    code: string,
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): Promise<void> {
    // 🔍 개발 시 확인용 로그
    const emailContent = {
      from: '"BlueCollar.cv" <support@bluecollar.cv>',
      replyTo: 'support@bluecollar.cv',
      to: email,
      subject: this.getVerificationSubject(type),
      body: this.getVerificationBody(email, code, type),
      code, // 개발 시 코드 확인
    };

    console.log('\n📧 Mock Email Service - Verification Email');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(emailContent, null, 2));
    console.log('─'.repeat(50) + '\n');

    this.logger.info(
      { email, type, code },
      '[MOCK] 이메일 인증 코드 발송 시뮬레이션',
    );
  }

  /**
   * 비밀번호 재설정 링크 발송 (Mock)
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    const emailContent = {
      from: '"BlueCollar.cv" <support@bluecollar.cv>',
      replyTo: 'support@bluecollar.cv',
      to: email,
      subject: '🔐 비밀번호 재설정 요청',
      body: `
안녕하세요!

비밀번호를 재설정하려면 아래 링크를 클릭하세요:
${resetLink}

⏰ 이 링크는 24시간 동안 유효합니다.
🔒 이 요청을 하지 않으셨다면 이 이메일을 무시하세요.

감사합니다,
BlueCollar Team
      `,
    };

    console.log('\n📧 Mock Email Service - Password Reset Email');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(emailContent, null, 2));
    console.log('─'.repeat(50) + '\n');

    this.logger.info(
      { email },
      '[MOCK] 비밀번호 재설정 이메일 발송 시뮬레이션',
    );
  }

  /**
   * 헬스 체크 (Mock은 항상 정상)
   */
  async isHealthy(): Promise<boolean> {
    this.logger.debug('[MOCK] 이메일 서비스 상태: 정상');
    return true;
  }

  // ─────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────

  /**
   * 인증 타입별 이메일 제목
   */
  private getVerificationSubject(
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): string {
    switch (type) {
      case 'SIGNUP':
        return '✉️ BlueCollar 회원가입 이메일 인증';
      case 'PASSWORD_RESET':
        return '🔐 비밀번호 재설정 인증';
      case 'EMAIL_CHANGE':
        return '📧 이메일 변경 인증';
      default:
        return 'BlueCollar 이메일 인증';
    }
  }

  /**
   * 인증 타입별 이메일 본문
   */
  private getVerificationBody(
    email: string,
    code: string,
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): string {
    const messages = {
      SIGNUP: `
BlueCollar에 가입해주셔서 감사합니다!

아래의 인증 코드를 입력하여 이메일을 인증하세요:

🔐 인증 코드: ${code}

⏰ 이 코드는 24시간 동안 유효합니다.

감사합니다,
BlueCollar Team
      `,
      PASSWORD_RESET: `
비밀번호를 재설정하기 위한 인증 코드입니다:

🔐 인증 코드: ${code}

⏰ 이 코드는 24시간 동안 유효합니다.

감사합니다,
BlueCollar Team
      `,
      EMAIL_CHANGE: `
이메일 변경을 완료하기 위한 인증 코드입니다:

🔐 인증 코드: ${code}

⏰ 이 코드는 24시간 동안 유효합니다.

감사합니다,
BlueCollar Team
      `,
    };

    return messages[type];
  }
}
