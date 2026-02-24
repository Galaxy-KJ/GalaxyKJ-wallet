"use client";

import Link from "next/link";

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium">
          @galaxy-kj/core-invisible-wallet
        </span>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            The Invisible Wallet
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400">
            Stellar Blockchain Without Seed Phrases
          </span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto mb-10">
          Let users sign Stellar transactions with just an email and passphrase.
          The SDK handles all cryptography locally — no seed phrases, no
          complexity, no compromise.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/docs/invisible-wallet/quick-start"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/30"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/invisible-wallet"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
          >
            View Demo
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── What Is Section ──────────────────────────────────────────────────────────

function WhatIsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Is Galaxy Invisible Wallet?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Seed phrases are long, fragile, and users constantly lose them.
            Galaxy Invisible Wallet eliminates them entirely.
          </p>
        </div>

        {/* Problem / Solution */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-3">
              The Problem
            </div>
            <p className="text-foreground/80">
              Traditional wallets force users to store 12–24 word seed phrases.
              They&apos;re complex, easy to lose, and a constant UX barrier that
              prevents mainstream adoption of blockchain apps.
            </p>
          </div>
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
            <div className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-3">
              The Solution
            </div>
            <p className="text-foreground/80">
              The SDK derives and encrypts the Stellar private key from an email
              + passphrase using PBKDF2, then stores it securely in IndexedDB
              with AES-256-GCM. Users just remember their credentials.
            </p>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Architecture Overview
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
            {/* User */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
                👤
              </div>
              <span className="text-sm font-semibold text-foreground">
                User
              </span>
              <span className="text-xs text-muted-foreground text-center">
                email + passphrase
              </span>
            </div>

            {/* Arrow right */}
            <div className="hidden md:flex flex-col items-center mx-2">
              <div className="h-px w-16 bg-gradient-to-r from-purple-500 to-blue-500" />
              <svg
                className="text-blue-400 -ml-1"
                width="8"
                height="12"
                viewBox="0 0 8 12"
                fill="currentColor"
              >
                <path d="M0 0l8 6-8 6z" />
              </svg>
            </div>
            <div className="md:hidden flex flex-col items-center my-1">
              <div className="w-px h-8 bg-gradient-to-b from-purple-500 to-blue-500" />
              <svg
                className="text-blue-400 -mt-1"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="currentColor"
              >
                <path d="M0 0l6 8 6-8z" />
              </svg>
            </div>

            {/* SDK */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl">
                🔐
              </div>
              <span className="text-sm font-semibold text-foreground">
                Galaxy SDK
              </span>
              <span className="text-xs text-muted-foreground text-center">
                AES-256-GCM + PBKDF2
              </span>
            </div>

            {/* Arrow right */}
            <div className="hidden md:flex flex-col items-center mx-2">
              <div className="h-px w-16 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <svg
                className="text-indigo-400 -ml-1"
                width="8"
                height="12"
                viewBox="0 0 8 12"
                fill="currentColor"
              >
                <path d="M0 0l8 6-8 6z" />
              </svg>
            </div>
            <div className="md:hidden flex flex-col items-center my-1">
              <div className="w-px h-8 bg-gradient-to-b from-blue-500 to-indigo-500" />
              <svg
                className="text-indigo-400 -mt-1"
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="currentColor"
              >
                <path d="M0 0l6 8 6-8z" />
              </svg>
            </div>

            {/* Stellar */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl">
                🌐
              </div>
              <span className="text-sm font-semibold text-foreground">
                Stellar Network
              </span>
              <span className="text-xs text-muted-foreground text-center">
                Testnet & Mainnet
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Key Features Grid ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🔐",
    title: "AES-256-GCM Encryption",
    description:
      "Military-grade symmetric encryption protects every private key stored locally.",
  },
  {
    icon: "📧",
    title: "Email-based Recovery",
    description:
      "No seed phrases. Users recover their wallet anytime with their email and passphrase.",
  },
  {
    icon: "⚡",
    title: "One-line Transaction Signing",
    description:
      "Sign and submit Stellar transactions with a single SDK call — all complexity is hidden.",
  },
  {
    icon: "🌐",
    title: "Testnet & Mainnet Support",
    description:
      "Switch networks with a config flag. Perfect for development and production deployments.",
  },
  {
    icon: "🎨",
    title: "React Hooks Ready",
    description:
      "useInvisibleWallet hook integrates seamlessly with any React or Next.js app.",
  },
  {
    icon: "📊",
    title: "Real-time Balance Tracking",
    description:
      "Live XLM and USDC balance updates pulled directly from the Stellar network.",
  },
  {
    icon: "🔔",
    title: "Event-driven Architecture",
    description:
      "Subscribe to wallet events (creation, signing, recovery) for reactive UI updates.",
  },
  {
    icon: "📝",
    title: "Audit Logging",
    description:
      "Every wallet operation is logged locally, giving users full transparency.",
  },
];

function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Key Features
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to build wallet-enabled apps — nothing you
            don&apos;t.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-purple-500/40 transition-colors"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="font-semibold text-foreground text-sm">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: "1",
    title: "Enter Email & Passphrase",
    description:
      "The user provides their email address and a strong passphrase. No seed phrase is ever generated or shown.",
  },
  {
    step: "2",
    title: "SDK Encrypts Locally",
    description:
      "The private key is derived and encrypted on-device using AES-256-GCM + PBKDF2 (100,000 iterations). It never leaves the device.",
  },
  {
    step: "3",
    title: "Transactions Sign Invisibly",
    description:
      "When the user signs a transaction, the SDK decrypts the key in memory, signs, and discards it — completely transparent to the user.",
  },
];

function HowItWorksSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Three steps. Zero seed phrases. Full Stellar integration.
          </p>
        </div>

        <div className="flex flex-col gap-0">
          {STEPS.map((item, index) => (
            <div key={item.step} className="flex gap-6">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-px flex-1 my-2 bg-gradient-to-b from-blue-600/50 to-transparent min-h-[40px]" />
                )}
              </div>

              {/* Content */}
              <div className="pb-10">
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Code Snippet ─────────────────────────────────────────────────────────────

const CODE_SNIPPET = `import { useInvisibleWallet } from '@galaxy-kj/core-invisible-wallet'

const { createWallet, wallet } = useInvisibleWallet({
  platformId: 'my-app-v1',
  defaultNetwork: 'testnet'
})

await createWallet('user@example.com', 'SecurePass123!')`;

function QuickStartSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quick Start
          </h2>
          <p className="text-muted-foreground text-lg">
            One hook. One call. A fully functional Stellar wallet.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-[hsl(222_47%_8%)] overflow-hidden">
          {/* Code bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">
              wallet.tsx
            </span>
          </div>

          <pre className="p-6 overflow-x-auto text-sm leading-relaxed font-mono">
            <code>
              {CODE_SNIPPET.split("\n").map((line, i) => {
                // Simple syntax-ish coloring via spans
                const formatted = line
                  // keywords
                  .replace(
                    /\b(import|from|const|await)\b/g,
                    '<span style="color:#c792ea">$1</span>'
                  )
                  // strings
                  .replace(
                    /('([^']*)')/g,
                    '<span style="color:#c3e88d">$1</span>'
                  )
                  // braces/brackets
                  .replace(
                    /([{}[\]()])/g,
                    '<span style="color:#89ddff">$1</span>'
                  )
                  // identifiers after import keyword is stripped
                  .replace(
                    /\b(useInvisibleWallet|createWallet|wallet|platformId|defaultNetwork)\b/g,
                    '<span style="color:#82aaff">$1</span>'
                  );

                return (
                  <div
                    key={i}
                    className="text-blue-50/90"
                    dangerouslySetInnerHTML={{ __html: formatted }}
                  />
                );
              })}
            </code>
          </pre>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/docs/invisible-wallet/quick-start"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Read the full Quick Start guide
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Security Highlights ──────────────────────────────────────────────────────

const SECURITY_ITEMS = [
  {
    icon: "🛡️",
    title: "AES-256-GCM with PBKDF2",
    description:
      "Key derivation runs 100,000 iterations of PBKDF2-SHA256 before encrypting with AES-256-GCM.",
  },
  {
    icon: "🧂",
    title: "Unique Salt & IV per Wallet",
    description:
      "Every wallet gets a freshly generated 32-byte salt and 16-byte IV, ensuring no two ciphertexts are alike.",
  },
  {
    icon: "🔒",
    title: "Private Keys Never Leave the Device",
    description:
      "Keys are decrypted in-memory only at signing time and immediately discarded. Nothing is sent to any server.",
  },
  {
    icon: "📋",
    title: "Audit Logging",
    description:
      "Every create, sign, and recover operation is logged locally with timestamps for full auditability.",
  },
];

function SecuritySection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Security Highlights
          </h2>
          <p className="text-muted-foreground text-lg">
            Built with cryptographic best practices from the ground up.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {SECURITY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 hover:border-blue-500/40 transition-colors"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1.5">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Use Cases ────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: "💱",
    title: "DeFi Apps",
    description:
      "Let users swap, lend, and earn on Stellar without ever seeing a seed phrase.",
  },
  {
    icon: "🎮",
    title: "Gaming",
    description:
      "In-game asset wallets that feel like a regular account login — not a crypto wallet.",
  },
  {
    icon: "🛒",
    title: "E-commerce Checkout",
    description:
      "Accept XLM or USDC payments with a frictionless checkout experience.",
  },
  {
    icon: "🏢",
    title: "Multi-tenant Platforms",
    description:
      "Deploy isolated wallet environments per tenant with the platformId config.",
  },
];

function UseCasesSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Use Cases
          </h2>
          <p className="text-muted-foreground text-lg">
            Wherever users need a wallet without the friction.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3 hover:border-purple-500/40 transition-colors"
            >
              <span className="text-3xl">{uc.icon}</span>
              <h3 className="font-semibold text-foreground">{uc.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {uc.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Live Demo CTA ────────────────────────────────────────────────────────────

function DemoCtaSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-600/10 to-blue-600/10 p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See It Live
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Try creating a wallet, checking your balance, and signing a
            transaction — all without a seed phrase.
          </p>
          <Link
            href="/invisible-wallet"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/30"
          >
            Open Live Demo
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Documentation Links ──────────────────────────────────────────────────────

const DOCS = [
  { label: "Quick Start", href: "/docs/invisible-wallet/quick-start" },
  { label: "API Reference", href: "/docs/invisible-wallet/api-reference" },
  { label: "Architecture", href: "/docs/invisible-wallet/architecture" },
  { label: "Security", href: "/docs/invisible-wallet/security" },
  { label: "Examples", href: "/docs/invisible-wallet/examples" },
];

function DocsSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Documentation
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to integrate and ship.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DOCS.map((doc) => (
            <Link
              key={doc.label}
              href={doc.href}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
            >
              <span className="font-medium text-foreground">{doc.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground group-hover:text-purple-400 transition-colors"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="py-10 px-4 border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>MIT License</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} Galaxy Wallet</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Galaxy-KJ/GalaxyKJ-wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@galaxy-kj/core-invisible-wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M0 0v24h24V0H0zm19.2 19.2H4.8V4.8h14.4v14.4z" />
              <path d="M7.2 7.2h9.6v9.6h-2.4v-7.2H9.6v7.2H7.2V7.2z" />
            </svg>
            npm
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function InvisibleWalletLanding() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <WhatIsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <QuickStartSection />
      <SecuritySection />
      <UseCasesSection />
      <DemoCtaSection />
      <DocsSection />
      <LandingFooter />
    </main>
  );
}
