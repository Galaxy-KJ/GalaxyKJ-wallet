// src/components/settings-pages/ThemeSettings.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { SettingsContext } from "@/contexts/setting-context";
import { useTheme } from "@/contexts/theme-context";

export default function ThemeSettings() {
  const { settings, setSetting } = useContext(SettingsContext);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const colors = ["purple", "blue", "green", "orange", "pink"];

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <div className="p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg space-y-6">
      {/* Dark Mode Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zm0 12a2 2 0 100-4 2 2 0 000 4zm8-2a.75.75 0 01.75.75h1.25a.75.75 0 010 1.5H18.75A.75.75 0 0118 12zm-16 0a.75.75 0 01.75.75H3.5a.75.75 0 010 1.5H2.75A.75.75 0 012 12zm14.657-6.657a.75.75 0 011.06 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884zm-12.314 0a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zm12.314 12.314a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884zm-12.314 0l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 11-1.06-1.06z" />
            </svg>
            <span className="text-gray-200 font-semibold">Dark Mode</span>
          </div>
          <Switch
            checked={isDark}
            onChange={() => setTheme(isDark ? "light" : "dark")}
            disabled={!mounted}
            className={`${
              isDark ? "bg-purple-600" : "bg-gray-700"
            } relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50`}
          >
            <span className="sr-only">Toggle dark mode</span>
            <span
              className={`${
                isDark ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform bg-white rounded-full transition`}
            />
          </Switch>
        </div>
        <p className="text-sm text-gray-400">
          Switch between light and dark themes
        </p>
      </div>

      {/* Accent Color Section */}
      <div className="space-y-2">
        <p className="text-gray-200 font-semibold">Accent Color</p>
        <p className="text-sm text-gray-400">
          Select the primary color for the interface
        </p>
        <div className="flex space-x-4">
          {colors.map((c) => {
            const isSelected = settings.accentColor === c;
            return (
              <div key={c} className="flex items-center space-x-2">
                {isSelected ? (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                ) : (
                  <span className="h-2 w-2 rounded-full invisible" />
                )}
                <button
                  onClick={() => setSetting("accentColor", c)}
                  style={{ backgroundColor: c }}
                  className="h-8 w-10 rounded-md transition-colors"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
