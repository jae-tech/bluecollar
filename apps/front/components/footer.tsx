"use client"

interface FooterProps {
  onSignupClick: () => void
}

export function Footer({ onSignupClick }: FooterProps) {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Bluecollar <span className="text-primary">CV</span>
            </span>
            <p className="text-sm text-muted-foreground">현장 전문가의 디지털 명함 플랫폼</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="푸터 메뉴">
            <a href="/search?tab=workers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">워커 탐색</a>
            <a href="/search?tab=projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">프로젝트 의뢰</a>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">서비스 소개</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">개인정보처리방침</a>
          </nav>

          {/* Social + CTA */}
          <div className="flex items-center gap-4">
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="#" aria-label="인스타그램" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" aria-label="카카오채널" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3C6.477 3 2 6.477 2 11c0 2.913 1.717 5.463 4.29 7.023L5.21 21l3.88-2.046A12.084 12.084 0 0012 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
                </svg>
              </a>
              <a href="#" aria-label="유튜브" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96C23 15.86 23 12 23 12s0-3.86-.46-5.58zM10 15.5v-7l6 3.5-6 3.5z"/>
                </svg>
              </a>
            </div>

            <button
              onClick={onSignupClick}
              className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© 2026 Bluecollar CV. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">사업자등록번호: 123-45-67890 · 대표: 김현장 · 서울특별시 강남구</p>
        </div>
      </div>
    </footer>
  )
}
