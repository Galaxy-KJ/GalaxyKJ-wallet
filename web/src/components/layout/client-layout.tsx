"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { initializeOptimizations } from "@/lib/performance/optimizations";
import { registerServiceWorker } from "@/lib/register-sw";

// Lazy load non-critical components
const LazyPrivacyConsentBanner = dynamic(
  () => import("@/components/ui/privacy-consent").then(mod => ({ default: mod.PrivacyConsentBanner })),
  {
    loading: () => null,
    ssr: false,
  }
);

const LazyOfflineStatusToast = dynamic(
  () => import("@/components/ui/offline-indicator").then(mod => ({ default: mod.OfflineStatusToast })),
  {
    loading: () => null,
    ssr: false,
  }
);

// Performance optimized client component
function ClientOptimizations() {
  useEffect(() => {
    // Initialize performance optimizations
    const initOptimizations = async () => {
      try {
        await initializeOptimizations({
          enablePerformanceMonitoring: true,
          enableCodeSplitting: true,
          enableLazyLoading: true,
          enableImageOptimization: true,
          maxBundleSize: 250, // 250KB
        });
      } catch (error) {
        console.warn('Failed to initialize performance optimizations:', error);
      }
    };

    initOptimizations();

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  return null;
}

export function ClientLayoutComponents() {
  return (
    <>
      <LazyOfflineStatusToast />
      <LazyPrivacyConsentBanner />
      <ClientOptimizations />
    </>
  );
}
