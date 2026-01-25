"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";

interface NotificationBannerProps {
  message: string;
  type?: "info" | "success" | "warning";
  storageKey?: string;
}

export function NotificationBanner({
  message,
  type = "success",
  storageKey = "account-welcome-banner-dismissed",
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
  };

  if (!isVisible) return null;

  const typeStyles = {
    info: "bg-blue-900/30 border-blue-700 text-blue-200",
    success: "bg-green-900/30 border-green-700 text-green-200",
    warning: "bg-yellow-900/30 border-yellow-700 text-yellow-200",
  };

  return (
    <div
      className={`${typeStyles[type]} border rounded-lg p-4 mb-6 flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1">
        {type === "success" && (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <p className="text-sm font-sans flex-1">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
