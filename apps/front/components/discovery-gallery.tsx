"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";
import { PROJECTS, WORKERS } from "@/lib/data";
import { getCodes, type MasterCode } from "@/lib/api";

interface DiscoveryGalleryProps {
  onCardClick: () => void;
}

export function DiscoveryGallery({ onCardClick }: DiscoveryGalleryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "workers">(
    "projects",
  );
  const [activeFilter, setActiveFilter] = useState("전체");
  const [specialties, setSpecialties] = useState<string[]>(["전체"]);

  useEffect(() => {
    getCodes("FIELD")
      .then((fields: MasterCode[]) => {
        setSpecialties(["전체", ...fields.map((f) => f.name)]);
      })
      .catch(() => {
        // API 실패 시 기본값 유지
      });
  }, []);

  const filteredProjects =
    activeFilter === "전체"
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === activeFilter);
  const filteredWorkers =
    activeFilter === "전체"
      ? WORKERS
      : WORKERS.filter((w) => w.specialty.includes(activeFilter));

  const handleFilterClick = (specialty: string) => {
    const params = new URLSearchParams();
    params.set("tab", activeTab);
    if (specialty !== "전체") params.set("specialty", specialty);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex flex-col gap-2 mb-10">
          <h2 className="text-3xl font-bold text-foreground">
            프로젝트 & 워커 탐색
          </h2>
          <p className="text-muted-foreground">
            검증된 현장 전문가와 시공 프로젝트를 둘러보세요
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-md p-1 w-fit mb-8 border border-border">
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "projects"
                ? "bg-card text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            프로젝트
          </button>
          <button
            onClick={() => setActiveTab("workers")}
            className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === "workers"
                ? "bg-card text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            워커
          </button>
        </div>

        {/* Specialty filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {specialties.map((s) => (
            <button
              key={s}
              onClick={() => {
                setActiveFilter(s);
                handleFilterClick(s);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                activeFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50 hover:text-primary"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => router.push(`/search?tab=${activeTab}`)}
            className="ml-auto text-sm font-semibold text-primary hover:underline flex-shrink-0"
          >
            전체 보기 &rarr;
          </button>
        </div>

        {/* Grid — show only first 2 rows (8 items, 4 cols) */}
        {activeTab === "projects" ? (
          <ProjectGrid projects={filteredProjects} onCardClick={onCardClick} />
        ) : (
          <WorkerGrid workers={filteredWorkers} onCardClick={onCardClick} />
        )}
      </div>
    </section>
  );
}

function ProjectGrid({
  projects,
  onCardClick,
}: {
  projects: typeof PROJECTS;
  onCardClick: () => void;
}) {
  const visible = projects.slice(0, 8);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {visible.map((project, i) => (
          <button
            key={project.id}
            onClick={onCardClick}
            className={`group text-left rounded-md overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors ${
              i >= 4 ? "opacity-0" : ""
            }`}
            style={i >= 4 ? { pointerEvents: "none" } : {}}
            aria-label={project.title}
          >
            <div className="aspect-video overflow-hidden bg-secondary">
              <Image
                src={project.img}
                alt={project.title}
                width={400}
                height={225}
                loading={i === 0 ? "eager" : "lazy"}
                priority={i === 0}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {project.title}
              </p>
              <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                {project.category}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Soft wall blur overlay — over 2nd row */}
      <SoftWall onSignupClick={onCardClick} />
    </div>
  );
}

function WorkerGrid({
  workers,
  onCardClick,
}: {
  workers: typeof WORKERS;
  onCardClick: () => void;
}) {
  const visible = workers.slice(0, 8);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {visible.map((worker, i) => (
          <button
            key={worker.id}
            onClick={onCardClick}
            className={`group text-left rounded-md overflow-hidden border border-border bg-card p-5 hover:border-primary/40 transition-colors ${
              i >= 4 ? "opacity-0" : ""
            }`}
            style={i >= 4 ? { pointerEvents: "none" } : {}}
            aria-label={`${worker.name} 프로필`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                  <Image
                    src={worker.img}
                    alt={worker.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                  <CheckCircle2 size={12} className="text-primary-foreground" />
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground">{worker.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {worker.region}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {worker.specialty.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-md border border-border"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star size={12} className="fill-primary text-primary" />
                <span className="font-semibold text-foreground">
                  {worker.rating}
                </span>
                <span>({worker.reviews})</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Soft wall blur overlay */}
      <SoftWall onSignupClick={onCardClick} />
    </div>
  );
}

function SoftWall({ onSignupClick }: { onSignupClick: () => void }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[62%] flex items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 25%, rgba(255,255,255,0.97) 60%, #FFFFFF 100%)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    >
      <div className="text-center flex flex-col items-center gap-4 mt-20">
        <p className="text-base font-semibold text-foreground">
          더 많은 프로젝트와 워커를 확인하세요.
        </p>
        <button
          onClick={onSignupClick}
          className="bg-primary text-primary-foreground text-sm font-bold px-8 py-3.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
