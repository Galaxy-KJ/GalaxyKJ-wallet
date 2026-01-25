"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  /** The currently resolved theme (after applying stored preference or system preference). */
  theme: Theme;
  /** Whether the user explicitly chose a theme (stored in localStorage). */
  hasStoredPreference: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  clearStoredPreference: () => void;
};

const STORAGE_KEY = "galaxy-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Helps form controls and scrollbars follow the theme.
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // During hydration we want to match whatever the pre-hydration script already applied.
    if (typeof document !== "undefined") return document.documentElement.classList.contains("dark") ? "dark" : "light";
    return "light";
  });
  const [hasStoredPreference, setHasStoredPreference] = useState<boolean>(() => readStoredTheme() != null);

  const resolveAndApply = useCallback(() => {
    const stored = readStoredTheme();
    const resolved = stored ?? getSystemTheme();
    applyTheme(resolved);
    setThemeState(resolved);
    setHasStoredPreference(stored != null);
    return { stored, resolved };
  }, []);

  useEffect(() => {
    const { stored } = resolveAndApply();

    // If there is no stored preference, keep in sync with OS theme changes.
    if (!stored && typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => resolveAndApply();

      // Safari < 14 uses addListener/removeListener.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyMq = mq as any;
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
      else if (typeof anyMq.addListener === "function") anyMq.addListener(onChange);

      return () => {
        if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", onChange);
        else if (typeof anyMq.removeListener === "function") anyMq.removeListener(onChange);
      };
    }
  }, [resolveAndApply]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(next);
    setThemeState(next);
    setHasStoredPreference(true);
  }, []);

  const clearStoredPreference = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    const resolved = getSystemTheme();
    applyTheme(resolved);
    setThemeState(resolved);
    setHasStoredPreference(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      hasStoredPreference,
      setTheme,
      toggleTheme,
      clearStoredPreference,
    }),
    [theme, hasStoredPreference, setTheme, toggleTheme, clearStoredPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export const THEME_STORAGE_KEY = STORAGE_KEY;

