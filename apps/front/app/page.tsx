"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { PortfolioStrip } from "@/components/portfolio-strip";
import { HowItWorks } from "@/components/how-it-works";
import { ClientCTA } from "@/components/client-cta";
import { Footer } from "@/components/footer";
import { SignupModal } from "@/components/signup-modal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

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
