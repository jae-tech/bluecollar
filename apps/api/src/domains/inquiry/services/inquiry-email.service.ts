import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * 의뢰 이메일 알림 서비스 (Resend SDK)
 *
 * 클라이언트가 의뢰를 제출하면 워커에게 이메일 알림을 발송합니다.
 * 기존 EmailModule(Nodemailer/Mock)과는 별개로, Resend SDK를 직접 사용합니다.
 *
 * 환경 변수:
 * - RESEND_API_KEY: Resend API 키 (없으면 콘솔 로그만 출력)
 * - RESEND_FROM_EMAIL: 발신 이메일 (기본값: noreply@bluecollar.cv)
 */
@Injectable()
export class InquiryEmailService {
  private readonly logger = new Logger(InquiryEmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@bluecollar.cv';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn(
        'RESEND_API_KEY 없음 — 의뢰 이메일 알림이 콘솔 로그로만 출력됩니다',
      );
    }
  }

  /**
   * 워커에게 새 의뢰 도착 알림 이메일 발송
   *
   * fire-and-forget 방식으로 호출 — 실패해도 의뢰 저장에 영향 없음.
   * 컨트롤러에서: void this.inquiryEmailService.sendInquiryNotification(...)
   *   .catch(err => logger.error(err))
   *
   * @param workerEmail 워커 이메일 주소
   * @param workerName 워커 이름 (사업명)
   * @param clientName 클라이언트 이름
   * @param location 시공 위치
   * @param workType 시공 종류
   * @param message 추가 메시지 (선택)
   * @param inquiryId 의뢰 ID (워커 대시보드 링크용)
   */
  async sendInquiryNotification(params: {
    workerEmail: string;
    workerName: string;
    clientName: string;
    location: string;
    workType: string;
    message?: string;
    inquiryId: string;
  }): Promise<void> {
    const {
      workerEmail,
      workerName,
      clientName,
      location,
      workType,
      message,
      inquiryId,
    } = params;

    const dashboardUrl = `${process.env.FRONTEND_URL ?? 'https://bluecollar.cv'}/dashboard?tab=inquiries&id=${inquiryId}`;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>새 의뢰가 도착했습니다</title></head>
<body style="font-family: 'Apple SD Gothic Neo', Pretendard, sans-serif; background: #f5f4f3; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden;">
    <div style="background: #FF6B00; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700;">새 의뢰가 도착했습니다</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #44403c; margin-top: 0;">${workerName}님, 새로운 시공 의뢰가 접수되었습니다.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #78716c; width: 100px; font-size: 14px;">의뢰인</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #292524; font-weight: 600;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #78716c; font-size: 14px;">시공 위치</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #292524;">${location}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #78716c; font-size: 14px;">시공 종류</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e7e5e4; color: #292524;">${workType}</td>
        </tr>
        ${
          message
            ? `<tr>
          <td style="padding: 10px 0; color: #78716c; font-size: 14px; vertical-align: top;">메시지</td>
          <td style="padding: 10px 0; color: #292524;">${message.replace(/\n/g, '<br>')}</td>
        </tr>`
            : ''
        }
      </table>
      <div style="margin-top: 28px; text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #FF6B00; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">의뢰 확인하기</a>
      </div>
      <p style="color: #a8a29e; font-size: 12px; margin-top: 28px; text-align: center;">블루칼라 · 본 메일은 발신 전용입니다</p>
    </div>
  </div>
</body>
</html>`;

    if (!this.resend) {
      // 개발/테스트 환경: 콘솔 로그로 대체
      this.logger.log(
        { workerEmail, clientName, workType, inquiryId },
        '[DEV] 의뢰 알림 이메일 (실제 발송 안 됨)',
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: workerEmail,
      subject: `[블루칼라] ${clientName}님의 새 의뢰가 도착했습니다`,
      html,
    });

    if (error) {
      // 이메일 발송 실패는 의뢰 저장 실패와 독립적으로 처리
      // 호출자가 catch로 로깅
      throw new Error(`Resend 이메일 발송 실패: ${JSON.stringify(error)}`);
    }

    this.logger.log({ workerEmail, inquiryId }, '의뢰 알림 이메일 발송 완료');
  }
}
