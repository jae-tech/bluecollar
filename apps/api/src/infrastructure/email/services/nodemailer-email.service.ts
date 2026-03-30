import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { IEmailService } from '../interfaces/email-service.interface';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

/**
 * Nodemailer 기반 이메일 서비스
 *
 * 프로덕션 환경에서 실제 이메일을 발송합니다.
 * Zoho Mail SMTP 기반 메일 서버를 사용합니다.
 *
 * 🎨 템플릿 엔진:
 * - Handlebars를 사용하여 HBS 템플릿 렌더링
 * - layout.hbs를 기본 레이아웃으로 사용
 * - 각 이메일 타입별 템플릿: auth-code.hbs, password-reset.hbs, welcome.hbs
 *
 * 환경 변수:
 * - EMAIL_SERVICE=nodemailer
 * - EMAIL_HOST=smtp.zoho.com
 * - EMAIL_PORT=587
 * - EMAIL_SECURE=false
 * - EMAIL_USER=hello@bluecollar.cv
 * - EMAIL_PASSWORD=zoho-app-password
 * - EMAIL_FROM=hello@bluecollar.cv
 * - EMAIL_REPLY_TO=support@bluecollar.cv
 */
@Injectable()
export class NodemailerEmailService implements IEmailService {
  private transporter!: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private layoutTemplate!: Handlebars.TemplateDelegate;

  // 발신자 주소 및 답장 주소
  private readonly fromAddress: string;
  private readonly replyToAddress: string;

  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(NodemailerEmailService.name);
    }

    // 발신자/답장 주소 설정 (환경 변수 기반)
    this.fromAddress = process.env.EMAIL_FROM || 'hello@bluecollar.cv';
    this.replyToAddress =
      process.env.EMAIL_REPLY_TO || 'support@bluecollar.cv';

    // 📧 Nodemailer 트랜스포터 초기화
    this.initializeTransporter();

    // 📝 HBS 템플릿 로드
    this.loadTemplates();
  }

  /**
   * Nodemailer 트랜스포터 초기화
   * 환경 변수에서 Zoho Mail SMTP 설정을 읽어 설정합니다.
   */
  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // 465포트는 true, 587포트는 false
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.logger.info(
      {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        from: this.fromAddress,
        replyTo: this.replyToAddress,
      },
      '🚀 Nodemailer Email Service 초기화 완료',
    );
  }

  /**
   * HBS 템플릿 파일 로드
   * 애플리케이션 시작 시 모든 템플릿을 메모리에 로드합니다.
   */
  private loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates');

      // layout.hbs 로드 (모든 이메일의 기본 구조)
      const layoutPath = path.join(templatesDir, 'layout.hbs');
      const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      this.layoutTemplate = Handlebars.compile(layoutContent);

      // 개별 템플릿 로드
      const templateFiles = [
        'auth-code.hbs',
        'password-reset.hbs',
        'welcome.hbs',
      ];

      for (const file of templateFiles) {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        this.templates.set(file, Handlebars.compile(content));
      }

      this.logger.debug(
        { count: this.templates.size },
        '✓ 모든 이메일 템플릿 로드 완료',
      );
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '❌ 이메일 템플릿 로드 실패',
      );
    }
  }

  /**
   * 템플릿 렌더링 헬퍼
   */
  private renderTemplate(templateName: string, data: any): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // 개별 템플릿 렌더링
    const body = template(data);

    // layout.hbs에 body 주입
    const html = this.layoutTemplate({ body });

    return html;
  }

  /**
   * 이메일 인증 코드 발송
   *
   * 📧 auth-code.hbs 템플릿을 사용합니다.
   */
  async sendVerificationEmail(
    email: string,
    code: string,
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): Promise<void> {
    try {
      // 📝 템플릿 데이터 준비
      const subject = this.getVerificationSubject(type);
      const templateData = {
        title: subject,
        message: this.getVerificationMessage(type),
        authCode: code,
      };

      // 🎨 HTML 렌더링
      const html = this.renderTemplate('auth-code.hbs', templateData);

      // 📧 이메일 발송
      await this.transporter.sendMail({
        from: `"BlueCollar" <${this.fromAddress}>`,
        replyTo: this.replyToAddress,
        to: email,
        subject: subject,
        html: html,
      });

      this.logger.info({ email, type }, '✓ 이메일 인증 코드 발송 성공');
    } catch (error) {
      this.logger.error(
        { email, type, error: (error as Error).message },
        '❌ 이메일 인증 코드 발송 실패',
      );
      throw error;
    }
  }

  /**
   * 비밀번호 재설정 링크 발송
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    try {
      // 📝 템플릿 데이터 준비
      const templateData = {
        resetLink,
      };

      // 🎨 HTML 렌더링
      const html = this.renderTemplate('password-reset.hbs', templateData);

      // 📧 이메일 발송
      await this.transporter.sendMail({
        from: `"BlueCollar" <${this.fromAddress}>`,
        replyTo: this.replyToAddress,
        to: email,
        subject: '🔐 비밀번호 재설정 요청',
        html: html,
      });

      this.logger.info({ email }, '✓ 비밀번호 재설정 이메일 발송 성공');
    } catch (error) {
      this.logger.error(
        { email, error: (error as Error).message },
        '❌ 비밀번호 재설정 이메일 발송 실패',
      );
      throw error;
    }
  }

  /**
   * 헬스 체크
   * SMTP 연결 테스트
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.debug('✓ SMTP 연결 정상');
      return true;
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        '❌ SMTP 연결 실패',
      );
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────────

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
   * 인증 타입별 안내 메시지
   */
  private getVerificationMessage(
    type: 'SIGNUP' | 'PASSWORD_RESET' | 'EMAIL_CHANGE',
  ): string {
    switch (type) {
      case 'SIGNUP':
        return 'BlueCollar에 가입해주셔서 감사합니다. 아래의 인증번호를 입력하여 이메일을 인증하세요.';
      case 'PASSWORD_RESET':
        return '비밀번호를 재설정하기 위한 인증코드입니다.';
      case 'EMAIL_CHANGE':
        return '이메일 변경을 완료하기 위한 인증코드입니다.';
      default:
        return 'BlueCollar 인증번호입니다.';
    }
  }
}
