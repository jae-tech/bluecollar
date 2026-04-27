import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ImapFlow } from 'imapflow';
import type { FetchMessageObject } from 'imapflow';
import { simpleParser, type AddressObject } from 'mailparser';

export interface InboxMessage {
  uid: number;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
  snippet: string; // 본문 앞 200자
}

export interface InboxMessageDetail extends InboxMessage {
  html: string | null;
  text: string | null;
  to: string;
}

/**
 * IMAP 수신함 서비스
 *
 * support@bluecollar.cv 메일함을 Zoho IMAP으로 조회합니다.
 * 각 요청마다 IMAP 연결을 열고 닫습니다 (연결 풀링 없음 — 관리자 전용 저빈도 사용).
 */
@Injectable()
export class AdminInboxService {
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AdminInboxService.name);
    }
    // config가 정상 주입된 경우에만 읽음 (테스트 환경 DI 안전성)
    if (this.config) {
      this.host = this.config.get<string>('IMAP_HOST', 'imappro.zoho.com');
      this.port = this.config.get<number>('IMAP_PORT', 993);
      this.user = this.config.get<string>('IMAP_USER', '');
      this.pass = this.config.get<string>('IMAP_PASS', '');
    } else {
      this.host = 'imappro.zoho.com';
      this.port = 993;
      this.user = '';
      this.pass = '';
    }
  }

  /**
   * IMAP 설정 여부 확인
   */
  isConfigured(): boolean {
    return Boolean(this.user && this.pass);
  }

  /**
   * IMAP 클라이언트 생성 헬퍼
   */
  private createClient(): ImapFlow {
    return new ImapFlow({
      host: this.host,
      port: this.port,
      secure: true,
      auth: { user: this.user, pass: this.pass },
      logger: false, // imapflow 내부 로그 비활성화
    });
  }

  /**
   * FetchMessageObject에서 발신자 주소 추출 헬퍼
   */
  private extractFrom(msg: FetchMessageObject): string {
    if (!msg.envelope) return '(알 수 없음)';
    return (
      msg.envelope.from?.[0]?.address ??
      msg.envelope.from?.[0]?.name ??
      '(알 수 없음)'
    );
  }

  /**
   * 받은편지함 목록 조회
   *
   * @param page 페이지 번호 (1부터 시작)
   * @param limit 페이지당 메시지 수
   * @returns 메시지 목록 (최신순)
   */
  async listMessages(
    page = 1,
    limit = 20,
  ): Promise<{ data: InboxMessage[]; total: number }> {
    if (!this.isConfigured()) {
      return { data: [], total: 0 };
    }

    const client = this.createClient();
    try {
      await client.connect();
      const mailbox = await client.mailboxOpen('INBOX');
      const total = mailbox.exists;

      if (total === 0) {
        return { data: [], total: 0 };
      }

      // 최신순 — 마지막 메시지부터 역순으로 페이지 계산
      const end = total - (page - 1) * limit;
      const start = Math.max(1, end - limit + 1);

      if (end < 1) {
        return { data: [], total };
      }

      const messages: InboxMessage[] = [];

      for await (const msg of client.fetch(`${start}:${end}`, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        bodyParts: ['text'],
      })) {
        const from = this.extractFrom(msg);

        // 텍스트 파트 스니펫
        let snippet = '';
        if (msg.bodyParts) {
          for (const [, buf] of msg.bodyParts) {
            const text = buf.toString('utf-8');
            snippet = text.replace(/\s+/g, ' ').trim().slice(0, 200);
            break;
          }
        }

        messages.push({
          uid: msg.uid,
          subject: msg.envelope?.subject ?? '(제목 없음)',
          from,
          date: (msg.envelope?.date ?? new Date()).toISOString(),
          seen: msg.flags?.has('\\Seen') ?? false,
          snippet,
        });
      }

      // 최신순 정렬
      messages.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return { data: messages, total };
    } catch (err) {
      this.logger.error({ err }, 'IMAP 목록 조회 실패');
      throw err;
    } finally {
      await client.logout().catch(() => null);
    }
  }

  /**
   * 특정 메시지 상세 조회 (UID 기반)
   *
   * @param uid 메시지 UID
   */
  async getMessage(uid: number): Promise<InboxMessageDetail | null> {
    if (!this.isConfigured()) return null;

    const client = this.createClient();
    try {
      await client.connect();
      await client.mailboxOpen('INBOX');

      // UID로 원본 가져오기
      const download = await client.fetchOne(
        String(uid),
        { source: true },
        { uid: true },
      );

      if (!download) return null;

      // imapflow fetchOne은 source를 Buffer로 반환
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawSource: Buffer | undefined = (download as any).source as
        | Buffer
        | undefined;
      if (!rawSource) return null;

      const parsed: import('mailparser').ParsedMail = await simpleParser(
        rawSource,
        {},
      );

      // mailparser의 AddressObject는 단일 객체 (value: EmailAddress[])
      const fromAddr = parsed.from as AddressObject | undefined;
      const from =
        fromAddr?.value?.[0]?.address ?? fromAddr?.text ?? '(알 수 없음)';

      const toAddr = parsed.to as AddressObject | AddressObject[] | undefined;
      let to = '';
      if (toAddr) {
        if (Array.isArray(toAddr)) {
          to = toAddr[0]?.value?.[0]?.address ?? toAddr[0]?.text ?? '';
        } else {
          to = toAddr.value?.[0]?.address ?? toAddr.text ?? '';
        }
      }

      const text = parsed.text ?? null;
      const snippet = text
        ? text.replace(/\s+/g, ' ').trim().slice(0, 200)
        : '';

      // 읽음 처리
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });

      return {
        uid,
        subject: parsed.subject ?? '(제목 없음)',
        from,
        to,
        date: (parsed.date ?? new Date()).toISOString(),
        seen: true,
        snippet,
        html: parsed.html || null,
        text,
      };
    } catch (err) {
      this.logger.error({ err, uid }, 'IMAP 메시지 상세 조회 실패');
      throw err;
    } finally {
      await client.logout().catch(() => null);
    }
  }
}
