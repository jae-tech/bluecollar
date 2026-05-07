import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

/**
 * SSE로 전송할 이벤트 페이로드
 */
export interface InquiryNotificationPayload {
  /** 이벤트 타입 */
  type: 'new_inquiry';
  /** 의뢰 ID */
  inquiryId: string;
  /** 의뢰 보낸 사람 이름 */
  clientName: string;
  /** 시공 종류 */
  workType: string;
  /** 지역 */
  location: string;
  /** 발생 시각 */
  timestamp: string;
}

/**
 * 내부 브로드캐스트 이벤트 (워커 프로필 ID 포함)
 */
interface BroadcastEvent {
  workerProfileId: string;
  payload: InquiryNotificationPayload;
}

/**
 * NotificationService
 *
 * 의뢰 생성 시 해당 워커의 SSE 스트림으로 실시간 알림을 전송합니다.
 * RxJS Subject 기반 in-process pub/sub — Redis 없이 단일 인스턴스에서 동작.
 *
 * 사용 패턴:
 *   - emit(): InquiryService에서 새 의뢰 생성 후 호출
 *   - stream(): InquiryController SSE 엔드포인트에서 워커별 스트림 구독
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly events$ = new Subject<BroadcastEvent>();

  /**
   * 새 의뢰 알림을 특정 워커의 SSE 채널에 발행
   *
   * @param workerProfileId 수신 대상 워커 프로필 ID
   * @param payload SSE로 전송할 이벤트 데이터
   */
  emit(workerProfileId: string, payload: InquiryNotificationPayload): void {
    this.logger.debug(
      { workerProfileId, inquiryId: payload.inquiryId },
      'SSE 알림 발행',
    );
    this.events$.next({ workerProfileId, payload });
  }

  /**
   * 특정 워커 전용 SSE Observable 반환
   *
   * NestJS @Sse() 핸들러에서 반환하면 Fastify가 text/event-stream으로 처리.
   *
   * @param workerProfileId 구독할 워커 프로필 ID
   * @returns MessageEvent 형식의 Observable
   */
  stream(workerProfileId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((e) => e.workerProfileId === workerProfileId),
      map(
        (e) =>
          ({
            data: e.payload,
          }) as MessageEvent,
      ),
    );
  }
}
