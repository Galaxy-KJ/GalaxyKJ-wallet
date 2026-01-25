"use client";

import { motion } from "framer-motion";

export function MissionSection() {
  return (
    <section className="relative py-12 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 text-center">
            About Galaxy Wallet
          </h1>

          <div className="space-y-6 text-lg text-blue-100/80">
            <p className="leading-relaxed">
              <span className="font-semibold text-white">Galaxy Smart Wallet</span> is a revolutionary decentralized wallet built on the{" "}
              <span className="text-purple-400 font-medium">Stellar blockchain</span>, designed to make crypto asset management secure, seamless, and accessible to everyone. We believe that blockchain technology should empower users, not overwhelm them with complexity.
            </p>

            <p className="leading-relaxed">
              At the heart of our platform is the groundbreaking{" "}
              <span className="text-blue-400 font-medium">Invisible Wallets</span> system, which eliminates the burden of managing private keys and seed phrases. Using military-grade encryption and a simple email + passphrase recovery model, we provide the security of self-custody with the convenience of traditional web applications. Your assets remain completely under your control, without the technical barriers that have held back mainstream adoption.
            </p>

            <p className="leading-relaxed">
              Built with modern technologies including Next.js, TypeScript, and Framer Motion, Galaxy Wallet delivers a beautiful, responsive interface that works seamlessly across all devices. Whether you're sending payments, automating transactions, or exploring the Stellar ecosystem, our platform offers powerful features with an intuitive design that respects your time and intelligence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
