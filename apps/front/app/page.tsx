"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { PortfolioStrip } from "@/components/portfolio-strip";
import { HowItWorks } from "@/components/how-it-works";
import { ClientCTA } from "@/components/client-cta";
import { Footer } from "@/components/footer";
import { SignupModal } from "@/components/signup-modal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  // 로그인 페이지 → 회원가입 링크 클릭 시 /?signup=1 로 이동
  // useSearchParams()는 Suspense 필요하므로 window.location.search 직접 파싱
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "1") {
      setModalOpen(true);
      // URL에서 파라미터 제거 (히스토리 오염 방지)
      router.replace("/", { scroll: false });
    }
  }, [router]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <main className="min-h-screen bg-background">
      <Navbar onSignupClick={openModal} />
      <HeroSection onSignupClick={openModal} />
      <PortfolioStrip />
      <HowItWorks />
      <ClientCTA onSignupClick={openModal} />
      <Footer onSignupClick={openModal} />
      <SignupModal open={modalOpen} onClose={closeModal} />
    </main>
  );
}
