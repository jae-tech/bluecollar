import { Module } from '@nestjs/common';
import { SlackNotificationService } from './services/slack-notification.service';

/**
 * Slack 알림 모듈
 *
 * 서버 에러 발생 시 Slack 웹훅을 통해 알림을 보냅니다.
 *
 * 환경 변수:
 * - SLACK_WEBHOOK_ERROR: Slack Incoming Webhook URL
 *   예: https://hooks.slack.com/services/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
 *
 * 사용법:
 * @Inject(SlackNotificationService) private slack: SlackNotificationService
 *
 * await this.slack.notifyFatalError(
 *   statusCode,
 *   errorMessage,
 *   requestPath,
 *   timestamp,
 *   httpMethod,
 *   clientIp,
 * );
 */
@Module({
  providers: [SlackNotificationService],
  exports: [SlackNotificationService],
})
export class SlackModule {}
