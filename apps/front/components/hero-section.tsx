"use client";

import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";

interface HeroSectionProps {
  onSignupClick: () => void;
}

export function HeroSection({ onSignupClick }: HeroSectionProps) {
  return (
    <section className="pt-28 pb-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold w-fit">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              현장 전문가를 위한 디지털 명함
            </div>

            <div className="flex flex-col gap-5">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-balance text-foreground">
                현장의 땀방울이
                <br />
                <span className="text-primary">당신의 이력</span>이<br />
                됩니다.
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-lg">
                흩어져 있던 시공 기록을 60초 만에 세련된 디지털 프로필 사이트로
                만드세요. 명함 대신 링크 하나면 충분합니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onSignupClick}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-base font-bold px-8 py-4 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                나만의 프로필 만들기
                <svg
                  width="16"
                  height="16"
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
              <button className="inline-flex items-center justify-center gap-2 text-base font-medium text-foreground px-8 py-4 rounded-xl border border-border hover:bg-secondary transition-colors">
                워커 둘러보기
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-background bg-secondary overflow-hidden"
                  >
                    <Image
                      src={`/images/worker-avatar-${Math.min(i, 4)}.jpg`}
                      alt={`워커 ${i}`}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className="fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,400+</span>{" "}
                  명의 현장 전문가가 이미 사용 중
                </p>
              </div>
            </div>
          </div>

          {/* Right: UI Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Main mockup card */}
              <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                {/* Profile header */}
                <div className="bg-foreground/5 px-6 pt-6 pb-4 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                        <Image
                          src="/images/worker-avatar-1.jpg"
                          alt="김철수 프로필"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <CheckCircle2
                          size={14}
                          className="text-primary-foreground fill-primary-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground">
                          김철수
                        </h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          인증됨
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        서울 · 경기 전문 시공팀
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["목공", "타일", "전기"].map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full border border-border font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={12} className="fill-primary text-primary" />
                        <span className="text-sm font-bold text-foreground">
                          4.9
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        리뷰 138개
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project grid */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    최근 시공 프로젝트
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { src: "/images/project-woodwork.jpg", label: "목공" },
                      { src: "/images/project-tile-work.jpg", label: "타일" },
                      { src: "/images/project-electrical.jpg", label: "전기" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden border border-border relative"
                      >
                        <Image
                          src={item.src}
                          alt={item.label}
                          width={120}
                          height={120}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-foreground/70 text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA in card */}
                <div className="px-4 pb-4">
                  <button
                    // onClick={onSignupClick}
                    className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    워커에게 문의하기
                  </button>
                </div>
              </div>

              {/* Floating stat badge */}
              <div className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs text-muted-foreground font-medium">
                  이번 달 완료
                </p>
                <p className="text-2xl font-bold text-foreground mt-0.5">
                  12건
                </p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  +3 지난달 대비
                </p>
              </div>

              {/* Floating profile link */}
              <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="text-brand"
                  >
                    <path
                      d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 10a5.5 5.5 0 01-4.33-2.1C4.68 9.9 6.26 9 8 9s3.32.9 4.33 1.9A5.5 5.5 0 018 13z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    나만의 링크
                  </p>
                  <p className="text-xs text-muted-foreground">
                    my.bluecollarcv.kr
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
