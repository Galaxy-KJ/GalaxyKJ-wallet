"use client";

import { motion } from "framer-motion";
import { Shield, Wifi, Globe, Zap, RefreshCw, Lock } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Lock className="h-7 w-7 text-purple-400" />,
      title: "Invisible Wallets",
      description: "No seed phrases to memorize. Secure your wallet with just an email and passphrase using military-grade AES-256-GCM encryption.",
    },
    {
      icon: <Wifi className="h-7 w-7 text-blue-400" />,
      title: "Offline Support",
      description: "Continue managing your assets even without internet connectivity. Transactions sync automatically when you're back online.",
    },
    {
      icon: <Globe className="h-7 w-7 text-green-400" />,
      title: "Stellar Integration",
      description: "Full compatibility with the Stellar ecosystem. Fast, low-cost transactions with real-time balance monitoring.",
    },
    {
      icon: <Shield className="h-7 w-7 text-cyan-400" />,
      title: "Bank-Grade Security",
      description: "PBKDF2 key derivation with 100,000 iterations, zero data leakage, and comprehensive audit logging protect your assets.",
    },
    {
      icon: <Zap className="h-7 w-7 text-yellow-400" />,
      title: "AI Recommendations",
      description: "Smart insights and personalized suggestions help you optimize your portfolio and make informed decisions.",
    },
    {
      icon: <RefreshCw className="h-7 w-7 text-pink-400" />,
      title: "Automated Payments",
      description: "Schedule recurring transactions and set up smart conditions for automatic crypto operations.",
    },
  ];

  return (
    <section className="relative py-12 md:py-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Core Features
          </h2>
          <p className="text-xl text-blue-100/70 max-w-3xl mx-auto">
            Everything you need for secure, seamless blockchain asset management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1E1E3F]/80 to-[#12132A]/80 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
