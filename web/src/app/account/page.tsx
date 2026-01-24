"use client";

import { ProfileHeader } from "@/components/account/profile-header";
import { ProfileDetails } from "@/components/account/profile-details";
import { NotificationBanner } from "@/components/account/notification-banner";
import { useWalletStore } from "@/store/wallet-store";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { publicKey, connectionStatus } = useWalletStore();
  const router = useRouter();

  const statusMessage = connectionStatus.isConnected
    ? "Welcome back — your wallet is synced"
    : "Connect your wallet to view account details";

  return (
    <div className="min-h-screen bg-[#0A0B1E] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Main Content */}
        <main>
          {/* Profile Header */}
          <ProfileHeader statusMessage={statusMessage} />

          {/* Notification Banner */}
          {publicKey && connectionStatus.isConnected && (
            <NotificationBanner
              message="Welcome back — your wallet is synced"
              type="success"
            />
          )}

          {/* Profile Details */}
          <ProfileDetails />
        </main>
      </div>
    </div>
  );
}
