"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ClientCTAProps {
  onSignupClick: () => void;
}

export function ClientCTA({ onSignupClick }: ClientCTAProps) {
  return (
    <section className="px-6 pb-20 border-t border-border pt-20">
      <div className="max-w-4xl mx-auto bg-foreground rounded-lg px-10 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
            클라이언트용
          </p>
          <h2 className="text-2xl font-bold text-primary-foreground leading-tight tracking-tight mb-3">
            직접 찾기 어려우셨나요?
          </h2>
          <p className="text-sm text-primary-foreground/50 leading-relaxed max-w-sm">
            프로젝트를 올리면 조건에 맞는 워커가 먼저 연락합니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-start md:items-end flex-shrink-0">
          <button
            onClick={onSignupClick}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-6 py-3 rounded-md hover:bg-primary/90 active:scale-95 transition-colors whitespace-nowrap"
          >
            프로젝트 의뢰하기
            <ArrowRight size={15} />
          </button>
          <Link
            href="/search?tab=workers"
            className="text-sm font-medium text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors border border-primary-foreground/15 px-5 py-2.5 rounded-md whitespace-nowrap"
          >
            워커 직접 찾기
          </Link>
          <p className="text-[11px] text-primary-foreground/25">
            무료로 시작 · 계약 성사 시에만 수수료
          </p>
        </div>
      </div>
    </section>
  );
}
