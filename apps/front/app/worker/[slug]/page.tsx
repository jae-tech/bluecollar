"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Star,
  Share2,
  MessageCircle,
  Phone,
  MapPin,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { WORKER_CONFIG } from "@/lib/worker-config";
import type { PortfolioProject } from "@/lib/worker-config";
import { ProjectModal } from "@/components/worker/project-modal";
import { InquiryForm } from "@/components/inquiry-form";
import { getMyWorkerProfile } from "@/lib/api";

// ---------------------------------------------------------------------------
// In production, Claude Code replaces this with:
//   const config = await fetchWorkerConfig(params.slug)
// ---------------------------------------------------------------------------
const config = WORKER_CONFIG;

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const urlSlug = params?.slug as string | undefined;
  const [activeTag, setActiveTag] = useState("\uC804\uCCB4");
  // 본인 프로필 여부 (URL slug와 내 프로필 slug 비교)
  const [isOwner, setIsOwner] = useState(false);
  // 실제 프로필의 fields (배너 표시 여부 판단용)
  const [myProfileFields, setMyProfileFields] = useState<string[]>([]);

  useEffect(() => {
    getMyWorkerProfile().then((profile) => {
      if (profile && profile.slug === urlSlug) {
        setIsOwner(true);
        setMyProfileFields(
          profile.fields?.map((f: { fieldCode: string }) => f.fieldCode) ?? [],
        );
      }
    });
  }, [urlSlug]);
  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);

  const allTags = ["\uC804\uCCB4", ...config.specialties];

  const filteredProjects =
    activeTag === "\uC804\uCCB4"
      ? config.portfolio
      : config.portfolio.filter((p) => p.tags.includes(activeTag));

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: config.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── Top Nav ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Worker brand logo */}
          <span className="text-base font-bold tracking-tight text-foreground">
            {config.brandName}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="프로필 공유"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">
                {"\uD504\uB85C\uD544 \uACF5\uC720"}
              </span>
            </button>
            <a
              href={`tel:${config.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <MessageCircle size={14} />
              {"\uC758\uB80C\uD558\uAE30"}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 pb-20">
        {/* ── 미완성 프로필 배너 ──────────────────────────────────────── */}
        {isOwner && myProfileFields.length === 0 && (
          <div className="mt-4 mb-2 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium text-amber-800">
              프로필이 아직 완성되지 않았어요. 정보를 추가하면 더 많은 고객을
              만날 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="flex-shrink-0 text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap"
            >
              지금 완성하기
            </button>
          </div>
        )}

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="pt-8 pb-10 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-border">
                <Image
                  src={config.avatar}
                  alt={config.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {config.cvVerified && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <BadgeCheck size={14} className="text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {config.name}
                </h1>
                {config.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    <BadgeCheck size={11} />
                    {"\uC790\uACA9\uC99D \uC778\uC99D"}
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg text-muted-foreground font-medium mb-3 text-pretty">
                {config.headline}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-primary fill-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {config.rating}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({config.reviews})
                  </span>
                </div>
                <div className="w-px h-3.5 bg-border" />
                <span className="text-sm text-muted-foreground">
                  {"\uACBD\uB825"}{" "}
                  <strong className="text-foreground">
                    {config.yearsOfExperience}
                    {"\uB144"}
                  </strong>
                </span>
                <div className="w-px h-3.5 bg-border" />
                <span className="text-sm text-muted-foreground">
                  {"\uc2dc\uacf5 \uc644\ub8cc"}{" "}
                  <strong className="text-foreground">
                    {config.totalProjects}
                    {"\uAC74"}
                  </strong>
                </span>
              </div>

              {/* Region */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <MapPin size={13} />
                {config.region}
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2 flex-wrap">
                <a
                  href={`tel:${config.phone}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  <Phone size={15} />
                  {"\uC758\uB80C\uD558\uAE30"}
                </a>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Share2 size={15} />
                  {"\uD504\uB85C\uD544 \uACF5\uC720"}
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed text-pretty">
            {config.bio}
          </p>

          {/* Specialty pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {config.specialties.map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary border border-border text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* ── Portfolio Gallery ────────────────────────────────────────── */}
        <section className="pt-10 pb-10 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">
              {"\uD3EC\uD2B8\uD3F4\uB9AC\uC624"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {config.portfolio.length}
              {"\uAC74"}
            </span>
          </div>

          {/* Tag filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeTag === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, i) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group text-left bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-video overflow-hidden bg-secondary relative">
                  <Image
                    src={project.coverImg}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading={i === 0 ? "eager" : "lazy"}
                    priority={i === 0}
                  />
                  {/* Photo count badge */}
                  {project.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-foreground/70 text-card text-xs font-medium">
                      +{project.images.length}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground text-balance leading-snug mb-1.5">
                    {project.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {project.location} · {project.year}
                    </span>
                    <ChevronRight
                      size={13}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Experience Timeline ───────────────────────────────────────── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-6">
            {"\uACBD\uB825"}
          </h2>
          <div className="flex flex-col gap-0">
            {config.experience.map((item, i) => (
              <div key={i} className="flex gap-5">
                {/* Timeline spine */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                  {i < config.experience.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1 mb-0 min-h-8" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-8">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">
                    {item.period}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {item.company}
                  </p>
                  <p className="text-sm text-primary font-medium mb-1">
                    {item.role}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact CTA ──────────────────────────────────────────────── */}
        <section className="pt-10">
          <div className="bg-secondary rounded-2xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {"\uC2DC\uACF5 \uBB38\uC758"}
            </p>
            <h2 className="text-xl font-bold text-foreground mb-2 text-balance">
              {"\uD504\uB85C\uC81D\uD2B8 \uC5F0\uB77D\uC8FC\uC138\uC694"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 text-pretty">
              {
                "\uCE74\uCE74\uC624\uD1A1 \uB610\uB294 \uC804\uD654\uB85C \uBB50\uC5B4\uB3C4 \uAD81\uAE08\uD55C \uC810 \uBB3C\uC5B4\uBCF4\uC138\uC694. \uBE60\uB978 \uAE30\uD55C \uC548\uC5D0 \uBC1D\uD600\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4."
              }
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href={`tel:${config.phone}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Phone size={15} />
                {config.phone}
              </a>
              <a
                href={`https://open.kakao.com/o/${config.kakao}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:border-primary/50 hover:text-primary transition-colors"
              >
                <MessageCircle size={15} />
                {"\uCE74\uCE74\uC624\uD1A1 \uBB38\uC758"}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-4">
        <div className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {config.name}
          </p>
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Powered by{" "}
            <span className="font-bold text-primary">Bluecollar CV</span>
          </a>
        </div>
      </footer>

      {/* ── Project Detail Modal ──────────────────────────────────────── */}
      <ProjectModal
        project={selectedProject}
        config={config}
        onClose={() => setSelectedProject(null)}
        onInquire={() => {
          setSelectedProject(null);
          setInquiryFormOpen(true);
        }}
      />

      {/* ── Inquiry Form ────────────────────────────────────────────── */}
      {inquiryFormOpen && (
        <InquiryForm
          workerName={config.name}
          onClose={() => setInquiryFormOpen(false)}
        />
      )}

      {/* ── Share toast ──────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg">
          {"\uB9C1\uD06C\uAC00 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4"}
        </div>
      )}
    </div>
  );
}
