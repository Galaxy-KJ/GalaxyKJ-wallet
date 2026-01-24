"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type MenuOption = {
  label: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
};

interface MobileMenuProps {
  options: MenuOption[];
}

export function MobileMenu({ options }: MobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  const handleOptionClick = (option: MenuOption) => {
    if (option.available) {
      router.push(option.href);
      setOpen(false);
    }
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Menu className="h-6 w-6 text-purple-400 hover:text-purple-300 transition" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card/70 backdrop-blur-sm shadow-xl p-4 space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={!option.available}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-all duration-200 ${
                !option.available
                  ? "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                  : isActiveRoute(option.href)
                    ? "bg-purple-500/10 text-purple-500 font-medium scale-105 shadow-lg"
                    : "bg-accent/50 hover:bg-purple-500/20 text-purple-400 font-medium hover:scale-105"
              }`}
              title={!option.available ? "Coming soon" : undefined}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {!option.available && (
                <span className="ml-auto text-xs text-gray-600">Soon</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
