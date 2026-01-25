import type { Metadata } from "next";
import { StarBackground } from "@/components/effects/star-background";
import { MissionSection } from "@/components/about/mission-section";
import { FeaturesSection } from "@/components/about/features-section";
import { ContactSection } from "@/components/about/contact-section";
import { Footer } from "@/components/welcome/footer";

export const metadata: Metadata = {
  title: "About - Galaxy Smart Wallet",
  description: "Learn about Galaxy Smart Wallet, a decentralized wallet built on Stellar featuring Invisible Wallets, offline support, and bank-grade security for seamless crypto asset management.",
};

export default function AboutPage() {
  return (
    <div className="relative w-full min-h-screen bg-[#0A0B1E] text-white">
      <StarBackground />
      
      <main className="relative z-10">
        <MissionSection />
        <FeaturesSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
