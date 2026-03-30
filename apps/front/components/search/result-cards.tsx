"use client"

import Image from "next/image"
import { CheckCircle2, Star, MessageCircle, Award } from "lucide-react"
import type { Project, Worker } from "@/lib/data"

// ── Project Card ──────────────────────────────────────────────────────────────

export function ProjectCard({
  project,
  onClick,
  priority = false,
}: {
  project: Project
  onClick: () => void
  priority?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
      aria-label={project.title}
    >
      <div className="aspect-video overflow-hidden bg-secondary relative">
        <Image
          src={project.img}
          alt={project.title}
          width={400}
          height={225}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-2 left-2 text-xs bg-foreground/70 text-primary-foreground px-2 py-0.5 rounded-md font-medium">
          {project.category}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2">
          {project.title}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full overflow-hidden border border-border flex-shrink-0">
            <Image
              src={project.workerImg}
              alt={project.worker}
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs text-muted-foreground">{project.worker}</span>
          <span className="ml-auto text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full">
            {project.scale.split(" ")[0]}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Worker Card ───────────────────────────────────────────────────────────────

export function WorkerCard({
  worker,
  onClick,
  priority = false,
}: {
  worker: Worker
  onClick: () => void
  priority?: boolean
}) {
  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden">
      <div className="p-5 flex flex-col items-center text-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
            <Image
              src={worker.img}
              alt={worker.name}
              width={64}
              height={64}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              className="w-full h-full object-cover"
            />
          </div>
          {worker.cvVerified && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
              <CheckCircle2 size={12} className="text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Name + region */}
        <div>
          <div className="flex items-center gap-1.5 justify-center">
            <p className="font-bold text-foreground">{worker.name}</p>
            {worker.verified && (
              <Award size={13} className="text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{worker.region}</p>
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1 justify-center">
          {worker.specialty.map((s) => (
            <span
              key={s}
              className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full border border-border"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-primary text-primary" />
            <span className="font-semibold text-foreground">{worker.rating}</span>
            <span>({worker.reviews})</span>
          </div>
          <span className="w-px h-3 bg-border" />
          <span className="font-medium text-foreground">{worker.years}년차</span>
          <span className="w-px h-3 bg-border" />
          <span>{worker.portfolioCount}건</span>
        </div>
      </div>

      {/* Contact button */}
      <div className="px-4 pb-4">
        <button
          onClick={onClick}
          className="w-full flex items-center justify-center gap-2 border border-border text-sm font-semibold text-foreground py-2.5 rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          <MessageCircle size={14} />
          문의하기
        </button>
      </div>
    </div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

export function SkeletonProjectCard() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-3.5 bg-secondary rounded w-4/5" />
        <div className="h-3 bg-secondary rounded w-2/3" />
        <div className="flex items-center gap-2 mt-1">
          <div className="w-5 h-5 rounded-full bg-secondary" />
          <div className="h-3 bg-secondary rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonWorkerCard() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="p-5 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-secondary" />
        <div className="h-4 bg-secondary rounded w-20" />
        <div className="h-3 bg-secondary rounded w-24" />
        <div className="flex gap-1.5">
          <div className="h-6 w-12 bg-secondary rounded-full" />
          <div className="h-6 w-12 bg-secondary rounded-full" />
        </div>
        <div className="h-3 bg-secondary rounded w-32" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-10 bg-secondary rounded-xl" />
      </div>
    </div>
  )
}
