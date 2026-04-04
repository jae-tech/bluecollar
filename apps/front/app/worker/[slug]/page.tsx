"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Share2,
  MessageCircle,
  Phone,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { WORKER_CONFIG } from "@/lib/worker-config";
import type { PortfolioProject } from "@/lib/worker-config";
import { ProjectModal } from "@/components/worker/project-modal";
import { InquiryForm } from "@/components/inquiry-form";
import { getMyWorkerProfile } from "@/lib/api";

const config = WORKER_CONFIG;

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const urlSlug = params?.slug as string | undefined;
  const [activeTag, setActiveTag] = useState("전체");
  const [isOwner, setIsOwner] = useState(false);
  const [myProfileFields, setMyProfileFields] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);

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

  const allTags = ["전체", ...config.specialties];
  const filteredProjects =
    activeTag === "전체"
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
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {config.brandName}
          </span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="공유"
          >
            <Share2 size={13} />
            공유
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 pb-24">
        {/* ── 미완성 배너 ── */}
        {isOwner && myProfileFields.length === 0 && (
          <div className="mt-5 flex items-center gap-3 border border-amber-200 rounded-md px-4 py-3 bg-amber-50">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="flex-1 text-xs text-amber-800">
              프로필이 아직 완성되지 않았어요.
            </p>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              지금 완성하기
            </button>
          </div>
        )}

        {/* ── Identity ── */}
        <section className="pt-10 pb-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-border flex-shrink-0">
              <Image
                src={config.avatar}
                alt={config.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {config.name}
                </h1>
                {config.cvVerified && (
                  <BadgeCheck
                    size={15}
                    className="text-primary flex-shrink-0"
                  />
                )}
                {config.verified && (
                  <span className="text-xs font-medium text-primary">
                    자격증 인증
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {config.headline}
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed mb-5 text-pretty">
            {config.bio}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {config.region}
            </span>
            <span>경력 {config.yearsOfExperience}년</span>
            <span>시공 {config.totalProjects}건</span>
            <span>
              ⭐ {config.rating} ({config.reviews})
            </span>
          </div>

          {/* Specialty pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {config.specialties.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-2">
            <a
              href={`tel:${config.phone}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Phone size={13} />
              의뢰하기
            </a>
            <a
              href={`https://open.kakao.com/o/${config.kakao}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:border-foreground/30 transition-colors"
            >
              <MessageCircle size={13} />
              카카오톡
            </a>
          </div>
        </section>

        {/* ── Portfolio ── */}
        <section className="py-8 border-t border-border">
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Work
            </p>
            <span className="text-xs text-muted-foreground">
              {config.portfolio.length}건
            </span>
          </div>

          {/* Tag filter */}
          {allTags.length > 2 && (
            <div className="flex gap-2 flex-wrap mb-5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    activeTag === tag
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Grid — no card borders, image + caption only */}
          <div className="grid grid-cols-2 gap-3">
            {filteredProjects.map((project, i) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group text-left"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-md bg-secondary relative mb-2">
                  <Image
                    src={project.coverImg}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:opacity-90 transition-opacity duration-200"
                    loading={i < 2 ? "eager" : "lazy"}
                    priority={i === 0}
                  />
                  {project.images.length > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-foreground/60 text-background text-[10px] font-medium">
                      +{project.images.length}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground leading-snug mb-0.5">
                  {project.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {project.location} · {project.year}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="py-8 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-5">
            Experience
          </p>
          <div className="space-y-5">
            {config.experience.map((item, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {item.company}
                  </p>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {item.period}
                  </p>
                </div>
                <p className="text-xs text-primary font-medium mb-1">
                  {item.role}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="py-8 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-5">
            Contact
          </p>
          <p className="text-sm text-foreground mb-1">{config.name}</p>
          <p className="text-sm text-muted-foreground mb-4">
            궁금한 점이 있으시면 편하게 연락주세요.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`tel:${config.phone}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Phone size={13} />
              {config.phone}
            </a>
            <a
              href={`https://open.kakao.com/o/${config.kakao}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:border-foreground/30 transition-colors"
            >
              <MessageCircle size={13} />
              카카오톡 문의
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {config.name}
          </p>
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by{" "}
            <span className="font-semibold text-primary">Bluecollar CV</span>
          </a>
        </div>
      </footer>

      {/* ── Project Modal ── */}
      <ProjectModal
        project={selectedProject}
        config={config}
        onClose={() => setSelectedProject(null)}
        onInquire={() => {
          setSelectedProject(null);
          setInquiryFormOpen(true);
        }}
      />

      {/* ── Inquiry Form ── */}
      {inquiryFormOpen && (
        <InquiryForm
          workerName={config.name}
          onClose={() => setInquiryFormOpen(false)}
        />
      )}

      {/* ── Share toast ── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium">
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
}
