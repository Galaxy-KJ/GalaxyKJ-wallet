"use client";

import { useMemo } from "react";
import { useWalletStore } from "@/store/wallet-store";
import { getCurrentUser } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

interface ProfileHeaderProps {
  statusMessage?: string;
}

export function ProfileHeader({ statusMessage }: ProfileHeaderProps) {
  const { publicKey, connectionStatus } = useWalletStore();
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Generate initials from email or use default
  const initials = useMemo(() => {
    if (user?.email) {
      const parts = user.email.split("@")[0].split(".");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  }, [user?.email]);

  // Default status message
  const displayStatus = statusMessage || 
    (connectionStatus.isConnected 
      ? "Your wallet is synced and ready" 
      : "Connect your wallet to get started");

  const displayName = user?.email?.split("@")[0] || "User";

  if (isLoading) {
    return (
      <header className="mb-8 animate-pulse">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gray-800" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-800 rounded" />
            <div className="h-4 w-64 bg-gray-800 rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl md:text-3xl shadow-lg ring-4 ring-gray-800"
            role="img"
            aria-label={`Avatar for ${displayName}`}
          >
            {initials}
          </div>
        </div>

        {/* Name and Status */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-sans">
            {displayName}
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-sans">
            {displayStatus}
          </p>
        </div>
      </div>
    </header>
  );
}
