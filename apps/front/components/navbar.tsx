"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User } from "lucide-react";
import { logout } from "@/lib/api";

interface NavbarProps {
  onSignupClick: () => void;
}

export function Navbar({ onSignupClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // accessToken은 httpOnly라 JS에서 읽을 수 없으므로
    // 로그인 시 서버가 심는 non-httpOnly authState 쿠키로 상태 판단
    const isLoggedIn = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("authState="));
    setLoggedIn(isLoggedIn);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Bluecollar <span className="text-primary">CV</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/search?tab=workers"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            워커 탐색
          </a>
          <a
            href="/search?tab=projects"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            프로젝트 탐색
          </a>
          <a
            href="/#about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            서비스 소개
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <User size={16} />내 계정
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-md py-1 z-50">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/dashboard");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <User size={14} />
                    대시보드
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut size={14} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                로그인
              </button>
              <button
                onClick={onSignupClick}
                className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                회원가입
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-4">
          <a
            href="/search?tab=workers"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-foreground"
          >
            워커 탐색
          </a>
          <a
            href="/search?tab=projects"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-foreground"
          >
            프로젝트 탐색
          </a>
          <a
            href="/#about"
            onClick={() => setMobileOpen(false)}
            className="text-sm font-medium text-foreground"
          >
            서비스 소개
          </a>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            {loggedIn ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <User size={14} />
                  대시보드
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <LogOut size={14} />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/login");
                  }}
                  className="text-sm font-medium text-muted-foreground"
                >
                  로그인
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onSignupClick();
                  }}
                  className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-md"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
