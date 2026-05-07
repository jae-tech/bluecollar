"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface InquiryNotificationPayload {
  type: "new_inquiry";
  inquiryId: string;
  clientName: string;
  workType: string;
  location: string;
  timestamp: string;
}

export interface UseInquiryNotificationsOptions {
  /** SSE 연결 활성화 여부 (WORKER 로그인 상태에서만 true) */
  enabled: boolean;
  /** 새 의뢰 수신 시 호출할 콜백 */
  onNewInquiry?: (payload: InquiryNotificationPayload) => void;
}

/**
 * 워커 대시보드용 SSE 실시간 의뢰 알림 훅
 *
 * - enabled=true일 때 /inquiries/notifications/stream을 EventSource로 구독
 * - 연결 끊김 시 지수 백오프(최대 30초)로 자동 재연결
 * - 컴포넌트 언마운트 시 커넥션 정리
 *
 * @returns unreadCount — 대시보드 탭 배지용 미확인 알림 수
 */
export function useInquiryNotifications({
  enabled,
  onNewInquiry,
}: UseInquiryNotificationsOptions) {
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef(1000); // 초기 재연결 딜레이 1초
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNewInquiryRef = useRef(onNewInquiry);

  // 콜백 ref 최신 유지 (재연결 클로저 stale 방지)
  useEffect(() => {
    onNewInquiryRef.current = onNewInquiry;
  }, [onNewInquiry]);

  const connect = useCallback(() => {
    // 기존 연결 정리
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(`${API_URL}/inquiries/notifications/stream`, {
      withCredentials: true,
    });
    esRef.current = es;

    es.onopen = () => {
      // 연결 성공 시 재연결 딜레이 초기화
      retryDelayRef.current = 1000;
    };

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const payload: InquiryNotificationPayload = JSON.parse(event.data);
        if (payload.type === "new_inquiry") {
          setUnreadCount((prev) => prev + 1);
          onNewInquiryRef.current?.(payload);
        }
      } catch {
        // 파싱 에러는 무시 (heartbeat 등 비페이로드 이벤트)
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      // 지수 백오프 재연결 (최대 30초)
      const delay = Math.min(retryDelayRef.current, 30000);
      retryDelayRef.current = Math.min(delay * 2, 30000);

      retryTimerRef.current = setTimeout(() => {
        if (enabled) connect();
      }, delay);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled, connect]);

  /** 의뢰 탭 진입 시 미확인 카운트 초기화 */
  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, clearUnread };
}
