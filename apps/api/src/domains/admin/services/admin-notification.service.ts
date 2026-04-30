import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';

/** SSE 알림 유형 */
export type NotificationEventType = 'NEW_USER' | 'NEW_DOCUMENT';

/** SSE 알림 페이로드 */
export interface NotificationPayload {
  type: NotificationEventType;
  data: unknown;
  timestamp: string;
}

/**
 * 관리자 실시간 알림 서비스 (인메모리 RxJS Subject 기반)
 *
 * - 서버 재시작 시 알림 유실 허용 (단일 인스턴스 전제)
 * - HTTP 엔드포인트 없음 — NestJS 내부 이벤트 버스로만 발행
 */
@Injectable()
export class AdminNotificationService {
  private readonly subject = new Subject<MessageEvent>();

  /**
   * SSE 이벤트 발행
   *
   * @param type 알림 유형 (NEW_USER, NEW_DOCUMENT)
   * @param data 이벤트 데이터
   */
  emit(type: NotificationEventType, data: unknown): void {
    const payload: NotificationPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.subject.next({ data: payload } as MessageEvent);
  }

  /**
   * SSE Observable 반환 — 컨트롤러에서 @Sse() 응답으로 사용
   */
  getStream(): Observable<MessageEvent> {
    return this.subject.asObservable();
  }
}
