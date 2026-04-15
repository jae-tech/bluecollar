import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bluecollar CV - 현장 전문가의 디지털 프로필",
  description:
    "흩어져 있던 시공 기록을 60초 만에 세련된 디지털 프로필 사이트로 만드세요. 목공, 타일, 전기, 도배, 설비 등 모든 분야의 현장 전문가를 위한 플랫폼.",
  generator: "v0.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 authState 쿠키를 읽어 body data attribute로 심음
  // Navbar가 이 값을 초기값으로 사용해 hydration flash를 방지
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("authState");

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BlueCollar CV",
              url: "https://bluecollar.cv",
              description:
                "흩어져 있던 시공 기록을 세련된 디지털 프로필 사이트로 만드는 현장 전문가 포트폴리오 플랫폼",
            }),
          }}
        />
      </head>
      <body
        className="font-sans antialiased bg-background text-foreground"
        data-auth={isLoggedIn ? "1" : "0"}
      >
        {children}
      </body>
    </html>
  );
}
