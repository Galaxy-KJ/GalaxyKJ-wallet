import type { Metadata } from "next";
import { InvisibleWalletLanding } from "@/components/invisible-wallet-landing/landing-page";

export const metadata: Metadata = {
  title: "Galaxy Invisible Wallet — Stellar Blockchain Without Seed Phrases",
  description:
    "The Galaxy Invisible Wallet SDK lets you integrate Stellar blockchain wallets into any app using email + passphrase — no seed phrases, no complexity.",
  openGraph: {
    title: "Galaxy Invisible Wallet — Stellar Blockchain Without Seed Phrases",
    description:
      "Integrate Stellar blockchain wallets in one line of code. AES-256-GCM encryption, email-based recovery, React hooks ready.",
    type: "website",
  },
};

export default function LandingPage() {
  return <InvisibleWalletLanding />;
}
