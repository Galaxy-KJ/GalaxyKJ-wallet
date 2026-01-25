"use client";

import { useWalletStore } from "@/store/wallet-store";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase-client";
import { Copy, Check } from "lucide-react";
import { useMemo } from "react";

interface DetailCardProps {
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
  monospace?: boolean;
}

function DetailCard({ label, value, copyable = false, monospace = false }: DetailCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!value) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1 font-sans uppercase tracking-wide">
            {label}
          </p>
          <p
            className={`text-sm text-white break-all ${
              monospace ? "font-mono" : "font-sans"
            }`}
          >
            {value}
          </p>
        </div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-purple-400 transition-colors"
            aria-label={`Copy ${label}`}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function ProfileDetails() {
  const { publicKey, account, connectionStatus, networkConfig } = useWalletStore();
  const [user, setUser] = useState<{ email?: string; id?: string; created_at?: string } | null>(null);
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

  // Format last login time
  const lastLogin = useMemo(() => {
    if (connectionStatus.lastSyncTime) {
      return connectionStatus.lastSyncTime.toLocaleString();
    }
    return "Never";
  }, [connectionStatus.lastSyncTime]);

  // Format account creation date
  const accountCreated = useMemo(() => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString();
    }
    return null;
  }, [user?.created_at]);

  // Count connected wallets (for now, just check if publicKey exists)
  const connectedWallets = publicKey ? 1 : 0;

  if (isLoading) {
    return (
      <section className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-800 rounded-lg" />
        <div className="h-24 bg-gray-800 rounded-lg" />
        <div className="h-24 bg-gray-800 rounded-lg" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4 font-sans">
        Account Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Public Key */}
        {publicKey && (
          <DetailCard
            label="Public Key"
            value={publicKey}
            copyable
            monospace
          />
        )}

        {/* User ID */}
        {user?.id && (
          <DetailCard
            label="User ID"
            value={user.id}
            copyable
            monospace
          />
        )}

        {/* Email */}
        {user?.email && (
          <DetailCard
            label="Email"
            value={user.email}
            copyable
          />
        )}

        {/* Network */}
        <DetailCard
          label="Network"
          value={networkConfig.type.toUpperCase()}
        />

        {/* Connected Wallets */}
        <DetailCard
          label="Connected Wallets"
          value={connectedWallets.toString()}
        />

        {/* Last Login */}
        <DetailCard
          label="Last Sync"
          value={lastLogin}
        />

        {/* Account Created */}
        {accountCreated && (
          <DetailCard
            label="Account Created"
            value={accountCreated}
          />
        )}

        {/* Connection Status */}
        <DetailCard
          label="Connection Status"
          value={
            connectionStatus.isConnected
              ? "Connected"
              : connectionStatus.error
              ? "Error"
              : "Disconnected"
          }
        />
      </div>
    </section>
  );
}
