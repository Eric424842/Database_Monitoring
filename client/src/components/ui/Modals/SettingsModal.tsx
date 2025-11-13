// src/components/ui/SettingsModal.tsx
// Modal Settings với Theme và Language dropdowns

import React from "react";
import { useSettings, type Theme, type Language } from "../../../contexts/SettingsContext";
import { useTranslation } from "../../../utils/i18n";
import { useThemeStyles } from "../../../utils/themeStyles";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, setTheme, setLanguage } = useSettings();
  const { t } = useTranslation();
  const theme = useThemeStyles();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.bg.card,
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: theme.text.primary }}>⚙️ {t("settings")}</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              color: theme.text.secondary,
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Theme Selection */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme.text.primary }}>
              {t("theme")}
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${theme.border.default}`,
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
                backgroundColor: theme.bg.input,
                color: theme.text.primary,
              }}
            >
              <option value="light">☀️ {t("light")}</option>
              <option value="dark">🌙 {t("dark")}</option>
            </select>
            <div style={{ fontSize: 12, color: theme.text.secondary, marginTop: 4 }}>
              {settings.theme === "light" && t("theme_light_desc")}
              {settings.theme === "dark" && t("theme_dark_desc")}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme.text.primary }}>
              {t("language")}
            </label>
            <select
              value={settings.language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${theme.border.default}`,
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
                backgroundColor: theme.bg.input,
                color: theme.text.primary,
              }}
            >
              <option value="vi">🇻🇳 {t("vietnamese")}</option>
              <option value="en">🇬🇧 {t("english")}</option>
            </select>
            <div style={{ fontSize: 12, color: theme.text.secondary, marginTop: 4 }}>
              {settings.language === "vi" && t("lang_vi_desc")}
              {settings.language === "en" && t("lang_en_desc")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: `1px solid ${theme.border.default}`,
              borderRadius: 6,
              cursor: "pointer",
              background: theme.bg.secondary,
              color: theme.text.primary,
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

