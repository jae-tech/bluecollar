import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/**
 * Slack 알림 서비스
 *
 * 서버 에러 발생 시 Slack 웹훅을 통해 알림을 보냅니다.
 *
 * 기능:
 * - 치명적 에러(500+, DB 연결 실패 등)만 선별해서 알림
 * - 중복 에러 방지: 1분 내 동일 에러 반복 시 첫 번째만 알림
 * - 아름다운 포매팅: Slack blocks 사용
 *
 * 환경 변수:
 * - SLACK_WEBHOOK_URL: Slack 웹훅 URL (필수)
 */
@Injectable()
export class SlackNotificationService {
  private readonly webhookUrl: string;

  // 에러 중복 방지: { errorHash: { count, firstTime, lastAlertTime } }
  private errorCache: Map<
    string,
    {
      count: number;
      firstTime: number;
      lastAlertTime: number;
    }
  > = new Map();

  // 중복 방지 시간 (1분 = 60000ms)
  private readonly DEDUP_WINDOW = 60 * 1000;

  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(SlackNotificationService.name);
    }

    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';

    if (!this.webhookUrl) {
      this.logger?.warn(
        '⚠️  SLACK_WEBHOOK_URL 환경 변수가 설정되지 않았습니다. Slack 알림이 전송되지 않습니다.',
      );
    }
  }

  /**
   * 치명적 에러를 Slack으로 알림
   *
   * @param statusCode HTTP 상태 코드
   * @param message 에러 메시지
   * @param path 요청 경로
   * @param timestamp 에러 발생 시간
   * @param method HTTP 메서드
   * @param ip 클라이언트 IP
   */
  async notifyFatalError(
    statusCode: number,
    message: string | string[],
    path: string,
    timestamp: string,
    method: string = 'UNKNOWN',
    ip: string = 'N/A',
  ): Promise<void> {
    // 웹훅 URL이 없으면 종료
    if (!this.webhookUrl) {
      return;
    }

    // 치명적 에러가 아니면 알림하지 않음 (500+ 또는 DB 연결 실패)
    if (!this.isFatalError(statusCode, message)) {
      return;
    }

    // 에러 해시 생성 (중복 방지용)
    const errorHash = this.generateErrorHash(statusCode, message, path);

    // 중복 에러 여부 확인
    if (!this.shouldAlert(errorHash)) {
      this.logger.debug(
        { errorHash, statusCode },
        '🔇 동일한 에러가 1분 내에 반복됨 - Slack 알림 건너뜀',
      );
      return;
    }

    // Slack 알림 전송
    try {
      const messageText = Array.isArray(message)
        ? message.join(' | ')
        : message;

      const payload = this.buildSlackPayload(
        statusCode,
        messageText,
        path,
        timestamp,
        method,
        ip,
      );

      await this.sendToSlack(payload);

      this.logger.info(
        { statusCode, path, method },
        '✅ Slack 에러 알림 전송 완료',
      );
    } catch (error) {
      // Slack 전송 실패는 로그만 남기고 무시 (메인 로직에 영향 없음)
      this.logger.error(
        { error: (error as Error).message },
        '❌ Slack 알림 전송 실패',
      );
    }
  }

  /**
   * 치명적 에러 여부 판단
   * - HTTP 500 이상
   * - DB 연결 실패
   * - 기타 심각한 서버 에러
   */
  private isFatalError(
    statusCode: number,
    message: string | string[],
  ): boolean {
    // 500 이상의 상태 코드는 모두 치명적
    if (statusCode >= 500) {
      return true;
    }

    // DB 연결 실패, 타임아웃 등 특정 메시지도 치명적
    const messageStr = Array.isArray(message) ? message.join(' ') : message;
    const fatalKeywords = [
      'database',
      'connection',
      'timeout',
      'unavailable',
      '데이터베이스',
      '연결',
    ];

    return fatalKeywords.some((keyword) =>
      messageStr.toLowerCase().includes(keyword),
    );
  }

  /**
   * 에러 해시 생성 (상태 코드 + 메시지 + 경로의 조합)
   */
  private generateErrorHash(
    statusCode: number,
    message: string | string[],
    path: string,
  ): string {
    const messageStr = Array.isArray(message) ? message[0] : message;
    return `${statusCode}:${messageStr}:${path}`;
  }

  /**
   * 중복 방지 로직
   * - 1분 내에 같은 에러가 반복되면 alert하지 않음
   * - 1분이 지나면 카운터 리셋
   */
  private shouldAlert(errorHash: string): boolean {
    const now = Date.now();
    const cached = this.errorCache.get(errorHash);

    if (!cached) {
      // 처음 보는 에러 → alert 실행
      this.errorCache.set(errorHash, {
        count: 1,
        firstTime: now,
        lastAlertTime: now,
      });
      return true;
    }

    // DEDUP_WINDOW 안에 같은 에러 재발생
    if (now - cached.lastAlertTime < this.DEDUP_WINDOW) {
      // 카운트만 증가시키고 alert하지 않음
      cached.count++;
      this.logger.debug(
        { errorHash, count: cached.count },
        `🔄 중복 에러 카운트: ${cached.count}`,
      );
      return false;
    }

    // DEDUP_WINDOW가 지나서 새로운 주기 시작
    cached.count = 1;
    cached.firstTime = now;
    cached.lastAlertTime = now;
    return true;
  }

  /**
   * Slack Payload 생성 (Block Kit 형식)
   *
   * 아름다운 포매팅으로 에러 정보를 한눈에 볼 수 있게 표시
   */
  private buildSlackPayload(
    statusCode: number,
    message: string,
    path: string,
    timestamp: string,
    method: string,
    ip: string,
  ): Record<string, any> {
    // 에러 심각도에 따라 색상 결정
    const color = this.getErrorColor(statusCode);
    const emoji = this.getErrorEmoji(statusCode);

    return {
      blocks: [
        // 헤더 (제목)
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Critical Server Error Detected`,
            emoji: true,
          },
        },

        // 구분선
        {
          type: 'divider',
        },

        // 에러 상태 코드 섹션
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status Code:*\n\`${statusCode}\` ${this.getStatusText(statusCode)}`,
            },
            {
              type: 'mrkdwn',
              text: `*HTTP Method:*\n\`${method}\``,
            },
          ],
        },

        // 에러 메시지 섹션
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error Message:*\n\`\`\`${message}\`\`\``,
          },
        },

        // 요청 경로 섹션
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Request Path:*\n\`${path}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Client IP:*\n\`${ip}\``,
            },
          ],
        },

        // 타임스탬프 섹션
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${timestamp}`,
          },
        },

        // 구분선
        {
          type: 'divider',
        },

        // 추가 정보 섹션 (환경 정보)
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🔗 *Environment:* \`${process.env.NODE_ENV || 'unknown'}\` | 🖥️  *Server:* \`${process.env.API_URL || 'N/A'}\``,
            },
          ],
        },
      ],
      attachments: [
        {
          color: color,
          fallback: `Critical Error: ${statusCode} - ${message}`,
        },
      ],
    };
  }

  /**
   * HTTP 상태 코드에 따른 색상 반환
   */
  private getErrorColor(statusCode: number): string {
    if (statusCode >= 500) {
      return '#FF0000'; // 빨강 (Critical)
    }
    if (statusCode >= 400) {
      return '#FFA500'; // 주황 (Warning)
    }
    return '#FFD700'; // 노랑 (Info)
  }

  /**
   * HTTP 상태 코드에 따른 이모지 반환
   */
  private getErrorEmoji(statusCode: number): string {
    if (statusCode >= 500) {
      return '🔴'; // Critical
    }
    if (statusCode >= 400) {
      return '⚠️ '; // Warning
    }
    return 'ℹ️ '; // Info
  }

  /**
   * HTTP 상태 코드에 따른 텍스트 반환
   */
  private getStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return statusTexts[statusCode] || 'Unknown Error';
  }

  /**
   * Slack 웹훅으로 메시지 전송
   */
  private async sendToSlack(payload: Record<string, any>): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Slack API error: ${response.status} ${response.statusText}`,
      );
    }
  }
}
