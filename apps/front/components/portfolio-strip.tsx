"use client";

import Image from "next/image";
import Link from "next/link";
import { PROJECTS } from "@/lib/data";

export function PortfolioStrip() {
  // 카드 배열을 두 번 복제해서 이음매 없는 무한 루프 구현
  const items = PROJECTS.slice(0, 8);
  const doubled = [...items, ...items];

  return (
    <section className="py-16 border-t border-border overflow-hidden">
      <div className="flex items-baseline justify-between px-6 mb-5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          최근 등록된 시공
        </p>
        <Link
          href="/search?tab=projects"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
        >
          전체 보기 →
        </Link>
      </div>

      {/* 자동 스크롤 마퀴 — 호버 시 정지, prefers-reduced-motion 대응 */}
      <div
        className="animate-marquee flex gap-2.5 px-6"
        style={{ width: "max-content" }}
      >
        {doubled.map((project, i) => (
          <Link
            key={`${project.id}-${i}`}
            href="/search?tab=projects"
            className="flex-shrink-0 w-44 rounded-md overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors"
            tabIndex={i >= items.length ? -1 : 0}
            aria-hidden={i >= items.length}
          >
            <div className="relative w-full h-36 bg-secondary overflow-hidden">
              <Image
                src={project.img}
                alt={project.title}
                fill
                className="object-cover"
                loading={i < 4 ? "eager" : "lazy"}
              />
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-neutral-800/70 text-white px-1.5 py-0.5 rounded-sm">
                {project.category}
              </span>
            </div>
            <div className="px-2.5 py-2">
              <p className="text-xs font-medium text-foreground leading-snug line-clamp-1">
                {project.title}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {project.worker}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
