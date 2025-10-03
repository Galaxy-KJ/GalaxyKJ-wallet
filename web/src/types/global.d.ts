// Ambient declaration for the global cache attached to window
// Using `any` here to avoid duplicating types defined within specific modules.
// This file is included by tsconfig's "**/*.ts" glob.

declare global {
  interface Window {
    /**
     * Global cross-component memoization cache.
     * Initialized lazily in code via: (window).__GALAXY_GLOBAL_CACHE__ ||= {}
     */
    __GALAXY_GLOBAL_CACHE__?: unknown;
  }
}

export {};
