"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { initializeOptimizations } from "@/lib/performance/optimizations";
import { registerServiceWorker } from "@/lib/register-sw";

const LazyPrivacyConsentBanner = dynamic(
  () => import("@/components/ui/privacy-consent").then((mod) => ({ default: mod.PrivacyConsentBanner })),
  {
    loading: () => null,
    ssr: false,
  }
);

const LazyOfflineStatusToast = dynamic(
  () => import("@/components/ui/offline-indicator").then((mod) => ({ default: mod.OfflineStatusToast })),
  {
    loading: () => null,
    ssr: false,
  }
);

function ClientOptimizations() {
  useEffect(() => {
    const init = async () => {
      try {
        await initializeOptimizations({
          enablePerformanceMonitoring: true,
          enableCodeSplitting: true,
          enableLazyLoading: true,
          enableImageOptimization: true,
          maxBundleSize: 250,
        });
      } catch (err) {
        console.warn("Failed to initialize performance optimizations:", err);
      }
    };

    init();

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker();
    }
  }, []);

  return null;
}

export default function ClientShell() {
  return (
    <>
      <Suspense fallback={null}>
        <LazyOfflineStatusToast />
      </Suspense>
      <ClientOptimizations />
    </>
  );
}
