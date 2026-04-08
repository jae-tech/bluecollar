"use client";

import Link from "next/link";
import { WORKERS } from "@/lib/data";

interface HeroSectionProps {
  onSignupClick: () => void;
}

export function HeroSection({ onSignupClick }: HeroSectionProps) {
  // 워커 미니카드 — 최대 4명
  const featured = WORKERS.slice(0, 4);

  return (
    <section className="min-h-[90vh] flex flex-col justify-center pt-28 pb-16 px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* 배지 */}
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-semibold mb-8 w-fit">
          ✦ 현장 기술자를 위한 포트폴리오
        </div>

        {/* 헤드라인 */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-foreground mb-6">
          일한 만큼
          <br />
          <span className="text-primary">증명하세요.</span>
        </h1>

        {/* 서브텍스트 */}
        <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10">
          시공 사진 몇 장으로 나만의 프로필 페이지를 만드세요.
          <br />
          견적 문의가 링크 하나로 들어옵니다.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-3 mb-16">
          <button
            onClick={onSignupClick}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-6 py-3 rounded-md hover:bg-primary/90 active:scale-95 transition-colors"
          >
            무료로 시작하기
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <Link
            href="/search?tab=workers"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-3 rounded-md border border-border hover:bg-secondary"
          >
            워커 둘러보기
          </Link>
        </div>

        {/* 워커 미니카드 */}
        <div className="border-t border-border pt-7">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            지금 활동 중인 전문가
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {featured.map((w) => (
              <button
                key={w.id}
                onClick={onSignupClick}
                className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-md bg-card hover:border-primary/50 transition-colors flex-shrink-0 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                  {w.name.slice(0, 1)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {w.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {w.specialty[0]}
                    {w.specialty[1] ? ` · ${w.specialty[1]}` : ""} · {w.region}
                  </span>
                  <span className="text-[11px] text-primary font-medium">
                    {w.slug}.bluecollar.cv
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
