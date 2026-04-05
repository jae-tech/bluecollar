"use client";

import { ArrowRight } from "lucide-react";

interface ClientCTAProps {
  onSignupClick: () => void;
}

export function ClientCTA({ onSignupClick }: ClientCTAProps) {
  return (
    <section className="py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-primary">클라이언트용</p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground text-balance leading-tight">
            적합한 워커를
            <br />
            찾지 못하셨나요?
          </h2>
          <p className="text-base text-foreground/60 leading-relaxed max-w-md">
            원하는 전문가를 찾지 못하셨다면, 직접 프로젝트를 올리고 적합한
            워커의 제안을 받아보세요.
          </p>
        </div>
        <div className="flex flex-col gap-4 items-start md:items-end flex-shrink-0">
          <button className="inline-flex items-center gap-3 bg-primary text-primary-foreground text-base font-bold px-8 py-4 rounded-md hover:bg-primary/90 active:scale-95 transition-colors">
            프로젝트 의뢰하기
            <ArrowRight size={18} />
          </button>
          <p className="text-sm text-foreground/40">
            무료로 시작 · 계약 성사 시에만 수수료 발생
          </p>
        </div>
      </div>
    </section>
  );
}
