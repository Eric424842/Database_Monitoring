// src/contexts/SettingsContext.tsx
// Context quản lý Settings (Theme + Language) cho toàn app

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark";
export type Language = "vi" | "en";

interface Settings {
  theme: Theme;
  language: Language;
}

interface SettingsContextType {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  resetSettings: () => void;
}

const SETTINGS_STORAGE_KEY = "pg_dashboard_settings";
const SCHEMA_VERSION = "1.0.0";

interface StoredSettings {
  schemaVersion: string;
  theme: Theme;
  language: Language;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  language: "vi",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings từ localStorage khi mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        
        // Kiểm tra schemaVersion
        if (parsed.schemaVersion !== SCHEMA_VERSION) {
          console.warn(
            `Settings schemaVersion mismatch: expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}. Resetting.`
          );
          localStorage.removeItem(SETTINGS_STORAGE_KEY);
          setSettings(DEFAULT_SETTINGS);
        } else {
          setSettings({
            theme: parsed.theme || DEFAULT_SETTINGS.theme,
            language: parsed.language || DEFAULT_SETTINGS.language,
          });
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Lưu settings vào localStorage
  const saveSettings = (newSettings: Settings) => {
    try {
      const stored: StoredSettings = {
        schemaVersion: SCHEMA_VERSION,
        theme: newSettings.theme,
        language: newSettings.language,
      };
      setSettings(newSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Set theme
  const setTheme = (theme: Theme) => {
    saveSettings({ ...settings, theme });
  };

  // Set language
  const setLanguage = (language: Language) => {
    saveSettings({ ...settings, language });
  };

  // Reset về mặc định
  const resetSettings = () => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  };

  // Áp dụng theme (light/dark)
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme, isLoaded]);

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setLanguage, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

