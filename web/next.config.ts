import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },

  // External packages for server components
  serverExternalPackages: ["@stellar/stellar-sdk"],

  // Performance optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Code splitting and bundling optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Stellar SDK in separate chunk
            stellar: {
              name: "stellar-sdk",
              chunks: "all",
              test: /[\\/]node_modules[\\/]@stellar[\\/]/,
              priority: 40,
              enforce: true,
            },
            // UI libraries chunk
            ui: {
              name: "ui-libs",
              chunks: "all",
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // Common vendor libraries
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 1,
              maxSize: 244000, // ~250KB
            },
            // Common app code
            common: {
              name: "common",
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              maxSize: 244000, // ~250KB
            },
          },
        },
      };
    }

    // Reduce bundle size by excluding unnecessary polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Performance optimizations for production
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;
      config.optimization.sideEffects = false;

      // Minimize bundle size
      config.optimization.minimize = true;
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // ESLint configuration
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },

  // Performance and caching headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.posthog.com https://js.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://app.posthog.com https://o450000000000000.ingest.sentry.io https://api.stellar.org https://horizon.stellar.org https://horizon-testnet.stellar.org https://friendbot.stellar.org",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Analytics and monitoring configuration
  env: {
    // Analytics environment variables
    NEXT_PUBLIC_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED || "true",
    NEXT_PUBLIC_PRIVACY_MODE: process.env.NEXT_PUBLIC_PRIVACY_MODE || "strict",

    // PostHog configuration
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
    NEXT_PUBLIC_POSTHOG_HOST:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",

    // Sentry configuration
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    SENTRY_ORG: process.env.SENTRY_ORG || "",
    SENTRY_PROJECT: process.env.SENTRY_PROJECT || "galaxy-wallet",
  },
  // PWA and service worker optimizations
  async rewrites() {
    return [
      {
        source: "/analytics/:path*",
        destination: "/api/analytics/:path*",
      },
    ];
  },

  // Compress responses
  compress: true,

  // Power optimization
  poweredByHeader: false,
};

export default nextConfig;
