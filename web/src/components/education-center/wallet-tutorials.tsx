"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function WalletTutorials() {
  const tutorials = [
    {
      id: "sending-receiving",
      title: "Sending & Receiving Crypto",
      description:
        "Learn how to safely send and receive cryptocurrency using Galaxy Wallet.",
      duration: 5,
      category: "Basic",
      completion: 100,
    },
    {
      id: "security-setup",
      title: "Security Setup Guide",
      description: "Set up advanced security features to protect your assets.",
      duration: 8,
      category: "Security",
      completion: 66,
    },
    {
      id: "crypto-converter",
      title: "Using the Crypto Converter",
      description:
        "Master the cryptocurrency conversion calculator for accurate conversions.",
      duration: 4,
      category: "Tools",
      completion: 0,
    },
    {
      id: "automations",
      title: "Setting Up Automations",
      description:
        "Create automated transactions and alerts based on market conditions.",
      duration: 10,
      category: "Advanced",
      completion: 33,
    },
    {
      id: "portfolio-tracking",
      title: "Portfolio Tracking & Analysis",
      description:
        "Learn to track and analyze your cryptocurrency portfolio performance.",
      duration: 7,
      category: "Finance",
      completion: 0,
    },
    {
      id: "backup-restore",
      title: "Backup & Restore",
      description:
        "Learn how to properly backup your wallet and restore it when needed.",
      duration: 6,
      category: "Security",
      completion: 0,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCategoryBadgeStyle = (category: string) => {
    // You can customize colors based on category if needed
    return "bg-white text-black";
  };

  const getProgressBarColor = (completion: number) => {
    if (completion === 0) return "bg-gray-600";
    if (completion < 50) return "bg-blue-600";
    if (completion < 100) return "bg-purple-600";
    return "bg-blue-500";
  };

  const getActionButton = (completion: number) => {
    if (completion === 100) {
      return <button className="text-sm font-medium text-white">Review</button>;
    } else if (completion > 0) {
      return (
        <button className="text-sm font-medium text-white">Continue</button>
      );
    } else {
      return <button className="text-sm font-medium text-white">Start</button>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {tutorials.map((tutorial) => (
        <div
          key={tutorial.id}
          className="border border-border rounded-lg overflow-hidden"
        >
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-medium text-foreground">
                {tutorial.title}
              </h3>
              <span
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  getCategoryBadgeStyle(tutorial.category),
                )}
              >
                {tutorial.category}
              </span>
            </div>

            <p className="text-gray-400 mb-4 text-sm">{tutorial.description}</p>

            <div className="flex items-center text-xs text-gray-400 mb-2">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{tutorial.duration} min</span>
              <span className="ml-auto">{tutorial.completion}% complete</span>
            </div>

            <div className="w-full h-1.5 bg-accent/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  getProgressBarColor(tutorial.completion),
                )}
                style={{ width: `${tutorial.completion}%` }}
              />
            </div>
          </div>

          <div className="border-t border-border px-5 py-3 flex justify-end">
            {getActionButton(tutorial.completion)}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
