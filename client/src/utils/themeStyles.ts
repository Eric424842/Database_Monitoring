// src/utils/themeStyles.ts
// Utility để tạo styles theo theme (light/dark)

import { useSettings } from "../contexts/SettingsContext";

export function useThemeStyles() {
  const { settings } = useSettings();
  const isDark = settings.theme === "dark";

  return {
    isDark,
    // Background colors
    bg: {
      primary: isDark ? "#1e293b" : "#ffffff",
      secondary: isDark ? "#334155" : "#f7f7f7",
      card: isDark ? "#334155" : "#ffffff",
      input: isDark ? "#334155" : "#ffffff",
    },
    // Text colors
    text: {
      primary: isDark ? "#f1f5f9" : "#333",
      secondary: isDark ? "#cbd5e1" : "#666",
      muted: isDark ? "#94a3b8" : "#999",
    },
    // Border colors
    border: {
      default: isDark ? "#475569" : "#ddd",
      light: isDark ? "#334155" : "#f0f0f0",
      dark: isDark ? "#64748b" : "#ccc",
    },
    // Card style helper
    cardStyle: {
      border: `1px solid ${isDark ? "#475569" : "#eee"}`,
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#334155" : "#fff",
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
    },
  };
}

