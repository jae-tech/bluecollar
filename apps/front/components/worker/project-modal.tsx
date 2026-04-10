"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Calendar,
  Layers,
  BadgeCheck,
  Star,
  Phone,
  MessageCircle,
} from "lucide-react";
import type { PortfolioProject, WorkerConfig } from "@/lib/worker-config";

interface ProjectModalProps {
  project: PortfolioProject | null;
  config: WorkerConfig;
  onClose: () => void;
  onInquire?: () => void;
}

export function ProjectModal({
  project,
  config,
  onClose,
  onInquire,
}: ProjectModalProps) {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    setImgIndex(0);
    if (project) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!project) return;
      if (e.key === "ArrowRight")
        setImgIndex((i) => Math.min(i + 1, project.images.length - 1));
      if (e.key === "ArrowLeft") setImgIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full md:max-w-5xl bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[96dvh] md:max-h-[90dvh] flex flex-col"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
          aria-label="\uB2EB\uAE30"
        >
          <X size={15} className="text-foreground" />
        </button>

        {/* Body — scrollable on mobile, two-column on desktop */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
          {/* LEFT — image + meta (scrollable) */}
          <div className="flex-1 overflow-y-auto md:border-r md:border-border">
            {/* Carousel */}
            <div
              className="relative bg-secondary"
              style={{ aspectRatio: "16/9" }}
            >
              <Image
                src={project.images[imgIndex]}
                alt={`${project.title} — ${imgIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
              {project.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => Math.max(i - 1, 0))}
                    disabled={imgIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
                    aria-label="\uC774\uC804 \uC0AC\uC9C4"
                  >
                    <ChevronLeft size={17} className="text-foreground" />
                  </button>
                  <button
                    onClick={() =>
                      setImgIndex((i) =>
                        Math.min(i + 1, project.images.length - 1),
                      )
                    }
                    disabled={imgIndex === project.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center disabled:opacity-25 hover:bg-card transition-colors"
                    aria-label="\uB2E4\uC74C \uC0AC\uC9C4"
                  >
                    <ChevronRight size={17} className="text-foreground" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {project.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-200 ${i === imgIndex ? "bg-card w-5" : "bg-card/50 w-1.5"}`}
                        aria-label={`\uC0AC\uC9C4 ${i + 1}`}
                      />
                    ))}
                  </div>
                  {/* Counter */}
                  <span className="absolute top-3 left-3 text-xs font-medium bg-foreground/60 text-card px-2 py-1 rounded-md">
                    {imgIndex + 1} / {project.images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {project.images.length > 1 && (
              <div className="flex gap-2 px-6 py-3 border-b border-border overflow-x-auto">
                {project.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-90"}`}
                  >
                    <Image
                      src={img}
                      alt={`thumb-${i}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance leading-tight mb-5">
                {project.title}
              </h2>

              {/* Meta grid — 2x2 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {
                    icon: MapPin,
                    label: "\uC2DC\uACF5 \uC704\uCE58",
                    value: project.location,
                  },
                  {
                    icon: Clock,
                    label: "\uC791\uC5C5 \uAE30\uAC04",
                    value: project.duration,
                  },
                  {
                    icon: Calendar,
                    label: "\uC2DC\uACF5 \uC5F0\uB3C4",
                    value: `${project.year}년`,
                  },
                  { icon: Layers, label: "\uADDC\uBAA8", value: project.scale },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-xl bg-secondary border border-border"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-border mb-6" />

              {/* Description */}
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {"\uC2DC\uACF5 \uACFC\uC815"}
              </h3>
              <p className="text-sm text-foreground leading-relaxed mb-6">
                {project.description}
              </p>

              {/* Materials */}
              {project.materials && project.materials.length > 0 && (
                <>
                  <div className="h-px bg-border mb-6" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {"\uC0AC\uC6A9 \uC790\uC7AC"}
                  </h3>
                  <ul className="flex flex-col gap-2 mb-6">
                    {project.materials.map((m) => (
                      <li
                        key={m}
                        className="flex items-center gap-2.5 text-sm text-foreground"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag.tagName}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border"
                  >
                    {tag.tagName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky sidebar (desktop) / bottom bar (mobile) */}
          <div className="md:w-72 flex-shrink-0 flex flex-col">
            {/* Desktop sticky sidebar */}
            <div className="hidden md:flex flex-col h-full p-6 gap-5">
              {/* Worker mini-profile */}
              <div className="flex items-center gap-3 pb-5 border-b border-border">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-border flex-shrink-0">
                    <Image
                      src={config.avatar}
                      alt={config.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {config.cvVerified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                      <BadgeCheck
                        size={10}
                        className="text-primary-foreground"
                      />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm">
                    {config.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {config.headline}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-primary text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {config.rating}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({config.reviews})
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-secondary border border-border text-center">
                  <p className="text-lg font-bold text-foreground">
                    {config.yearsOfExperience}
                    <span className="text-sm font-semibold">{"\uB144"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {"\uACBD\uB825"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary border border-border text-center">
                  <p className="text-lg font-bold text-foreground">
                    {config.totalProjects}
                    <span className="text-sm font-semibold">{"\uAC74"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {"\uC644\uB8CC \uC2DC\uACF5"}
                  </p>
                </div>
              </div>

              {/* Specialty tags */}
              <div className="flex flex-wrap gap-1.5">
                {config.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Push buttons to bottom */}
              <div className="flex-1" />

              {/* CTA block */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {
                    "\uC774 \uD504\uB85C\uC81D\uD2B8\uAC00 \uB9C8\uC74C\uC5D0 \uB4DC\uC154\uC694?"
                  }
                </p>
                <button
                  onClick={onInquire || (() => {})}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <MessageCircle size={15} />
                  {"\uC774 \uD504\uB85C\uC81D\uD2B8 \uBB38\uC758\uD558\uAE30"}
                </button>
                <a
                  href={`tel:${config.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Phone size={14} />
                  {config.phone}
                </a>
              </div>
            </div>

            {/* Mobile bottom CTA */}
            <div className="md:hidden flex items-center gap-2 px-5 py-4 border-t border-border bg-card">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {"\uC774 \uD504\uB85C\uC81D\uD2B8 \uBB38\uC758"}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {config.name}
                </p>
              </div>
              <button
                onClick={onInquire}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <MessageCircle size={14} />
                {"\uBB38\uC758\uD558\uAE30"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
