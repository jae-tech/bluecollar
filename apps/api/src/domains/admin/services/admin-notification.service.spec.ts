import { describe, it, expect } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { AdminNotificationService } from './admin-notification.service';

describe('AdminNotificationService', () => {
  it('emit()이 Observable에 이벤트를 발행한다 (NEW_USER)', async () => {
    const service = new AdminNotificationService();

    const received = firstValueFrom(service.getStream().pipe(take(1)));
    service.emit('NEW_USER', { userId: 'u-1' });

    const event = await received;
    const payload = event.data as { type: string; data: unknown };
    expect(payload.type).toBe('NEW_USER');
    expect(payload.data).toEqual({ userId: 'u-1' });
  });

  it('emit()이 Observable에 이벤트를 발행한다 (NEW_DOCUMENT)', async () => {
    const service = new AdminNotificationService();

    const received = firstValueFrom(service.getStream().pipe(take(1)));
    service.emit('NEW_DOCUMENT', { docId: 'd-1' });

    const event = await received;
    const payload = event.data as { type: string; data: unknown };
    expect(payload.type).toBe('NEW_DOCUMENT');
  });

  it('getStream()은 Observable을 반환한다', () => {
    const service = new AdminNotificationService();
    const stream = service.getStream();
    expect(typeof stream.subscribe).toBe('function');
  });
});
