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
  Briefcase,
  Calendar,
  Clock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getPublicProfile, getMyWorkerProfile } from "@/lib/api";
import type { PublicProfile, PublicProfilePortfolio } from "@/lib/api";
import { PortfolioDetailModal } from "@/components/worker/portfolio-detail-modal";
import { SPACE_TYPE_LABEL } from "@/lib/constants";

// 업종 코드 → 표시명 매핑
const FIELD_LABEL: Record<string, string> = {
  TILE: "타일",
  WALLPAPER: "도배",
  PAINTING: "페인트",
  FLOORING: "바닥재",
  PLUMBING: "배관",
  ELECTRICAL: "전기",
  CARPENTRY: "목공",
  MASONRY: "조적",
  WATERPROOFING: "방수",
  INSULATION: "단열",
  GLASS: "유리",
  METAL: "금속",
  HVAC: "냉난방",
  DEMOLITION: "철거",
  GENERAL: "종합",
};

function fieldLabel(code: string) {
  return FIELD_LABEL[code] ?? code;
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const urlSlug = params?.slug as string | undefined;

  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] =
    useState<PublicProfilePortfolio | null>(null);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    if (!urlSlug) return;

    getPublicProfile(urlSlug)
      .then((data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setPublicProfile(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });

    // 소유자 확인 — 비로그인 시 /login 리다이렉트 없이 조용히 처리
    getMyWorkerProfile(true)
      .then((p) => {
        if (p?.slug === urlSlug) setIsOwner(true);
      })
      .catch(() => {});
  }, [urlSlug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: publicProfile?.profile.businessName ?? "",
        url,
      });
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      } catch {
        // 인앱 브라우저 등 clipboard API 미지원 환경 — 무시
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !publicProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* 헤더 — 정상 프로필 헤더와 동일한 스타일 */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-5 h-12 flex items-center">
            <a
              href="/"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Bluecollar <span className="text-primary">CV</span>
            </a>
          </div>
        </header>

        {/* 본문 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          {/* 아이콘 영역 */}
          <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center">
            <AlertTriangle size={22} className="text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold text-foreground">
              프로필을 찾을 수 없어요
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              링크가 잘못되었거나 워커가 프로필을 삭제했을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              홈으로 돌아가기
            </a>
            <a
              href="/search?tab=workers"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              다른 워커 둘러보기
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { profile, user, fields, portfolios } = publicProfile;

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {profile.businessName}
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
        {/* 소유자 배너 */}
        {isOwner && (
          <div className="mt-5 flex items-center gap-3 border border-border rounded-md px-4 py-3 bg-secondary">
            <AlertTriangle
              size={14}
              className="text-muted-foreground flex-shrink-0"
            />
            <p className="flex-1 text-xs text-muted-foreground">
              내 공개 프로필을 보고 있습니다.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              대시보드로 이동
            </button>
          </div>
        )}

        {/* Identity */}
        <section className="pt-10 pb-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-border flex-shrink-0 bg-secondary flex items-center justify-center">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt={profile.businessName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {profile.businessName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {profile.businessName}
                </h1>
                {profile.businessVerified && (
                  <BadgeCheck
                    size={15}
                    className="text-primary flex-shrink-0"
                  />
                )}
              </div>
              {user?.realName && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.realName}
                </p>
              )}
            </div>
          </div>

          {profile.careerSummary && (
            <p className="text-sm text-foreground/80 leading-relaxed mb-5 text-pretty">
              {profile.careerSummary}
            </p>
          )}

          {/* 메타 행 */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5 flex-wrap">
            {profile.officeDistrict ? (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {profile.officeCity} {profile.officeDistrict}
              </span>
            ) : profile.officeAddress ? (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {profile.officeAddress}
              </span>
            ) : null}
            {profile.yearsOfExperience != null && (
              <span className="flex items-center gap-1">
                <Briefcase size={11} />
                경력 {profile.yearsOfExperience}년
              </span>
            )}
            {profile.operatingHours && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {profile.operatingHours}
              </span>
            )}
            {portfolios.length > 0 && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                시공 {portfolios.length}건
              </span>
            )}
          </div>

          {/* 업종 태그 */}
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {fields.map((f) => (
                <span
                  key={f.fieldCode}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {fieldLabel(f.fieldCode)}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2">
            {profile.officePhoneNumber ? (
              <a
                href={`tel:${profile.officePhoneNumber}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Phone size={13} />
                의뢰하기
              </a>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary/50 text-primary-foreground text-sm font-semibold cursor-not-allowed"
              >
                <Phone size={13} />
                의뢰하기
              </button>
            )}
          </div>
        </section>

        {/* 포트폴리오 */}
        <section className="py-8 border-t border-border">
          <div className="flex items-baseline justify-between mb-5">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Work
            </p>
            <span className="text-xs text-muted-foreground">
              {portfolios.length}건
            </span>
          </div>

          {portfolios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 등록된 포트폴리오가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {portfolios.map((portfolio, i) => {
                // 커버: AFTER → BEFORE → DETAIL → 첫 번째 순서로
                const coverMedia =
                  portfolio.media.find((m) => m.imageType === "AFTER") ??
                  portfolio.media.find((m) => m.imageType === "BEFORE") ??
                  portfolio.media[0];

                return (
                  <button
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolio(portfolio)}
                    className="group text-left"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-secondary relative mb-2">
                      {coverMedia ? (
                        <Image
                          src={coverMedia.mediaUrl}
                          alt={portfolio.title}
                          fill
                          className="object-cover group-hover:opacity-90 transition-opacity duration-200"
                          loading={i < 2 ? "eager" : "lazy"}
                          priority={i === 0}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            사진 없음
                          </span>
                        </div>
                      )}
                      {portfolio.media.length > 1 && (
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-foreground/60 text-background text-[10px] font-medium">
                          +{portfolio.media.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground leading-snug mb-0.5">
                      {portfolio.title}
                    </p>
                    {/* 위치·평형·공간 유형 칩 */}
                    {(portfolio.location ||
                      portfolio.details?.area ||
                      portfolio.spaceType) && (
                      <div className="flex gap-1 mt-1 mb-0.5 flex-wrap">
                        {portfolio.location && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                            {portfolio.location}
                          </span>
                        )}
                        {portfolio.details?.area && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                            {parseFloat(portfolio.details.area)}
                            {portfolio.details.areaUnit === "SQMETER"
                              ? "m²"
                              : "평"}
                          </span>
                        )}
                        {portfolio.spaceType && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium">
                            {SPACE_TYPE_LABEL[portfolio.spaceType] ??
                              portfolio.spaceType}
                          </span>
                        )}
                      </div>
                    )}
                    {portfolio.startDate && (
                      <p className="text-[11px] text-muted-foreground">
                        {portfolio.startDate.slice(0, 7).replace("-", "년 ")}월
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {profile.businessName}
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

      {/* 포트폴리오 상세 모달 */}
      <PortfolioDetailModal
        portfolio={selectedPortfolio}
        workerName={profile.businessName}
        phone={profile.officePhoneNumber ?? undefined}
        onClose={() => setSelectedPortfolio(null)}
      />

      {/* 공유 토스트 */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium">
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
}
