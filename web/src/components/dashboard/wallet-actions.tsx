"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, History } from "lucide-react";

export function WalletActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Send",
      icon: ArrowUpRight,
      href: "/send-receive?tab=send",
      gradient: "from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700",
      shadow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    },
    {
      label: "Receive",
      icon: ArrowDownLeft,
      href: "/send-receive?tab=receive",
      gradient: "from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800",
      shadow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.35)]",
    },
    {
      label: "Transactions",
      icon: History,
      href: "/transactions",
      gradient: "from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700",
      shadow: "hover:shadow-[0_0_15px_rgba(124,58,237,0.5)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map(({ label, icon: Icon, href, gradient, shadow }) => (
        <Button
          key={label}
          onClick={() => router.push(href)}
          className={`w-full h-14 sm:h-20 bg-gradient-to-br ${gradient} border-0 rounded-2xl flex flex-row sm:flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${shadow}`}
          aria-label={label}
        >
          <Icon className="h-7 w-7" />
          <span className="font-bold tracking-wide uppercase text-[10px]">
            {label}
          </span>
        </Button>
      ))}
    </div>
  );
}
