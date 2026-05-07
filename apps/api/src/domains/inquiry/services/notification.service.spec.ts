import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { NotificationService } from './notification.service';
import type { InquiryNotificationPayload } from './notification.service';

/**
 * NotificationService Unit Tests
 *
 * 테스트 대상:
 * - emit(): 특정 워커에게 이벤트 발행
 * - stream(): 워커별 SSE Observable 필터링
 */
describe('NotificationService', () => {
  let service: NotificationService;

  const makePayload = (
    override: Partial<InquiryNotificationPayload> = {},
  ): InquiryNotificationPayload => ({
    type: 'new_inquiry',
    inquiryId: 'inq-uuid-1',
    clientName: '홍길동',
    workType: '타일',
    location: '서울 강남구',
    timestamp: new Date().toISOString(),
    ...override,
  });

  beforeEach(() => {
    service = new NotificationService();
  });

  it('emit 후 동일 workerProfileId의 stream이 이벤트를 수신해야 함', async () => {
    const workerProfileId = 'wp-uuid-1';
    const payload = makePayload();

    // stream 구독 (첫 번째 이벤트 1개만 수집)
    const received$ = service.stream(workerProfileId).pipe(take(1));
    const promise = firstValueFrom(received$);

    service.emit(workerProfileId, payload);

    const event = await promise;
    expect(event.data).toEqual(payload);
  });

  it('다른 workerProfileId의 스트림은 이벤트를 수신하지 않아야 함', async () => {
    const workerA = 'wp-uuid-A';
    const workerB = 'wp-uuid-B';
    const payload = makePayload({ inquiryId: 'inq-for-A' });

    // workerB 스트림 구독 — 100ms 내 이벤트 없으면 빈 배열
    const events: MessageEvent[] = [];
    const sub = service.stream(workerB).subscribe((e) => events.push(e));

    // workerA에게만 emit
    service.emit(workerA, payload);

    // 비동기 전파 대기
    await new Promise((resolve) => setTimeout(resolve, 50));
    sub.unsubscribe();

    expect(events).toHaveLength(0);
  });

  it('동일 워커에게 여러 번 emit 시 모두 수신해야 함', async () => {
    const workerProfileId = 'wp-uuid-1';
    const payloads = [
      makePayload({ inquiryId: 'inq-1' }),
      makePayload({ inquiryId: 'inq-2' }),
      makePayload({ inquiryId: 'inq-3' }),
    ];

    // 3개 이벤트 수집
    const received$ = service.stream(workerProfileId).pipe(take(3), toArray());
    const promise = firstValueFrom(received$);

    for (const payload of payloads) {
      service.emit(workerProfileId, payload);
    }

    const events = await promise;
    expect(events).toHaveLength(3);
    expect(events[0].data).toMatchObject({ inquiryId: 'inq-1' });
    expect(events[1].data).toMatchObject({ inquiryId: 'inq-2' });
    expect(events[2].data).toMatchObject({ inquiryId: 'inq-3' });
  });

  it('여러 워커가 동시에 구독 중일 때 각자에게만 전달되어야 함', async () => {
    const workerA = 'wp-uuid-A';
    const workerB = 'wp-uuid-B';

    const eventsA: MessageEvent[] = [];
    const eventsB: MessageEvent[] = [];

    const subA = service.stream(workerA).subscribe((e) => eventsA.push(e));
    const subB = service.stream(workerB).subscribe((e) => eventsB.push(e));

    service.emit(workerA, makePayload({ inquiryId: 'for-A' }));
    service.emit(workerB, makePayload({ inquiryId: 'for-B' }));
    service.emit(workerA, makePayload({ inquiryId: 'for-A-2' }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    subA.unsubscribe();
    subB.unsubscribe();

    expect(eventsA).toHaveLength(2);
    expect(eventsB).toHaveLength(1);
    expect(eventsA[0].data).toMatchObject({ inquiryId: 'for-A' });
    expect(eventsB[0].data).toMatchObject({ inquiryId: 'for-B' });
  });

  it('구독자가 없을 때 emit해도 에러가 발생하지 않아야 함', () => {
    expect(() => {
      service.emit('wp-uuid-nobody', makePayload());
    }).not.toThrow();
  });
});
