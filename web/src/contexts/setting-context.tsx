// src/contexts/SettingsContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";

export type TabKey = "theme" | "visualization" | "notifications" | "language";

export interface Settings {
  theme: "light" | "dark";
  accentColor: string;
  chartStyle: string;
  showBalances: boolean;
  compactMode: boolean;
  priceAlerts: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  language: string;
}

const defaultSettings: Settings = {
  theme: "light",
  accentColor: "purple",
  chartStyle: "Gradient",
  showBalances: true,
  compactMode: false,
  priceAlerts: false,
  transactionAlerts: false,
  securityAlerts: false,
  language: "en",
};

export const SettingsContext = createContext<{
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}>({
  settings: defaultSettings,
  setSetting: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Cargar configuración desde localStorage en cliente
  useEffect(() => {
    try {
      const stored: Settings = {
        theme:
          (localStorage.getItem("galaxy-theme") as "light" | "dark") ||
          defaultSettings.theme,
        accentColor:
          localStorage.getItem("accentColor") || defaultSettings.accentColor,
        chartStyle:
          localStorage.getItem("chartStyle") || defaultSettings.chartStyle,
        showBalances: localStorage.getItem("showBalances") === "true",
        compactMode: localStorage.getItem("compactMode") === "true",
        priceAlerts: localStorage.getItem("priceAlerts") === "true",
        transactionAlerts: localStorage.getItem("transactionAlerts") === "true",
        securityAlerts: localStorage.getItem("securityAlerts") === "true",
        language: localStorage.getItem("language") || defaultSettings.language,
      };
      setSettings(stored);
    } catch {
      // En SSR localStorage no existe, ignorar
    }
  }, []);

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : String(value),
        );
      } catch {
        // Ignorar errores en SSR
      }
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}
