"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onSignupClick: () => void;
}

export function Navbar({ onSignupClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            프로젝트 의뢰
          </a>
          <a
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            서비스 소개
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onSignupClick}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            로그인
          </button>
          <button
            onClick={onSignupClick}
            className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            회원가입
          </button>
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
            className="text-sm font-medium text-foreground"
          >
            워커 탐색
          </a>
          <a
            href="/search?tab=projects"
            className="text-sm font-medium text-foreground"
          >
            프로젝트 의뢰
          </a>
          <a href="/" className="text-sm font-medium text-foreground">
            서비스 소개
          </a>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <button
              onClick={onSignupClick}
              className="text-sm font-medium text-muted-foreground"
            >
              로그인
            </button>
            <button
              onClick={onSignupClick}
              className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg"
            >
              회원가입
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
