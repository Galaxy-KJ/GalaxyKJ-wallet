"use client";

import { motion } from "framer-motion";
import { Mail, Github, MessageCircle } from "lucide-react";

export function ContactSection() {
  const contactLinks = [
    {
      icon: <Mail className="h-5 w-5" />,
      label: "Email",
      value: "hello@galaxywallet.io",
      href: "mailto:hello@galaxywallet.io",
    },
  ];

  const socialLinks = [
    {
      icon: <Github className="h-5 w-5" />,
      label: "GitHub",
      href: "https://github.com/galaxy-wallet",
    },
    {
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      label: "X",
      href: "https://x.com/galaxywallet",
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: "Discord",
      href: "https://discord.gg/galaxywallet",
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
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Get in Touch
          </h2>
          <p className="text-xl text-blue-100/70 mb-12">
            Have questions or want to learn more? We&apos;d love to hear from you.
          </p>

          {/* Contact Email */}
          <div className="mb-10">
            {contactLinks.map((contact, index) => (
              <motion.a
                key={index}
                href={contact.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] text-white font-medium text-lg"
              >
                {contact.icon}
                <span>{contact.value}</span>
              </motion.a>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-blue-100/60 text-sm uppercase tracking-wider">
              Follow Us
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1 }}
                  className="p-4 bg-gradient-to-br from-[#1E1E3F]/80 to-[#12132A]/80 backdrop-blur-sm rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.2)] text-blue-100 hover:text-white"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}