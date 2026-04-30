"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMe, getAdminDocumentPendingCount } from "@/lib/api";

/** SSE 알림 페이로드 */
interface SseNotification {
  type: "NEW_USER" | "NEW_DOCUMENT";
  data: unknown;
  timestamp: string;
}

const SSE_RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [pendingDocCount, setPendingDocCount] = useState(0);
  const [notifications, setNotifications] = useState<SseNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const evtSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdminRef = useRef(false);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (!user || user.role !== "ADMIN") {
          router.replace("/dashboard");
        } else {
          isAdminRef.current = true;
          setChecking(false);
          // PENDING 서류 건수 초기 로드
          getAdminDocumentPendingCount()
            .then(({ count }) => setPendingDocCount(count))
            .catch(() => {});
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  // SSE 연결 (관리자 인증 후)
  useEffect(() => {
    if (checking) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const connect = () => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
      }

      const es = new EventSource(`${API_URL}/admin/notifications/stream`, {
        withCredentials: true,
      });
      evtSourceRef.current = es;

      es.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(e.data) as SseNotification;
          setNotifications((prev) => [payload, ...prev].slice(0, 50));
          setUnreadCount((n) => n + 1);

          // PENDING 서류 알림이면 배지 카운트도 갱신
          if (payload.type === "NEW_DOCUMENT") {
            getAdminDocumentPendingCount()
              .then(({ count }) => setPendingDocCount(count))
              .catch(() => {});
          }
          // 신규 가입자면 PENDING 카운트는 변동 없음
        } catch {}
      };

      es.onerror = () => {
        es.close();
        evtSourceRef.current = null;

        // exponential backoff 재연결
        const delay =
          SSE_RECONNECT_DELAYS[
            Math.min(
              reconnectAttemptRef.current,
              SSE_RECONNECT_DELAYS.length - 1,
            )
          ] ?? 30000;
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [checking]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">확인 중...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/users", label: "유저 관리" },
    {
      href: "/admin/documents",
      label: "서류 심사",
      badge: pendingDocCount > 0 ? pendingDocCount : undefined,
    },
    { href: "/admin/codes", label: "코드 관리" },
    { href: "/admin/audit", label: "감사 로그" },
    { href: "/admin/inbox", label: "수신함" },
  ];

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    if (!bellOpen) {
      setUnreadCount(0);
    }
  };

  const getNotificationLink = (n: SseNotification) => {
    if (n.type === "NEW_DOCUMENT") return "/admin/documents";
    if (n.type === "NEW_USER") return "/admin/users";
    return "/admin";
  };

  const getNotificationText = (n: SseNotification) => {
    if (n.type === "NEW_DOCUMENT") return "새 사업자 서류가 제출되었습니다";
    if (n.type === "NEW_USER") return "신규 회원이 가입했습니다";
    return "새 알림";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 네비게이션 */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-bold text-foreground tracking-tight"
            >
              Bluecollar CV{" "}
              <span className="text-muted-foreground font-normal">admin</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                    {item.badge != null && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-4 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* 알림 벨 */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="알림"
              >
                {/* 벨 아이콘 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-4 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {bellOpen && (
                <div className="absolute right-0 top-8 w-80 bg-card border border-border rounded-lg shadow-sm z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-xs font-medium text-foreground">알림</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      새 알림이 없습니다
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifications.map((n, idx) => (
                        <li key={`${n.timestamp}-${idx}`}>
                          <Link
                            href={getNotificationLink(n)}
                            onClick={() => setBellOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground">
                                {getNotificationText(n)}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(n.timestamp).toLocaleTimeString(
                                  "ko-KR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              일반 대시보드로
            </Link>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
