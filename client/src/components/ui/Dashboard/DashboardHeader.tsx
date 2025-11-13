// src/components/ui/DashboardHeader.tsx
// Header component cho Dashboard

import React from "react";
import type { RefreshInterval } from "../../../hooks/useAutoRefresh";
import { useThemeStyles } from "../../../utils/themeStyles";
import { useTranslation } from "../../../utils/i18n";

interface DashboardHeaderProps {
  minSec: number;
  onMinSecChange: (value: number) => void;
  onRefresh: () => void;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: RefreshInterval;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onAutoRefreshIntervalChange: (interval: RefreshInterval) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  minSec,
  onMinSecChange,
  onRefresh,
  autoRefreshEnabled,
  autoRefreshInterval,
  onAutoRefreshToggle,
  onAutoRefreshIntervalChange,
}) => {
  const theme = useThemeStyles();
  const { t } = useTranslation();

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text.primary }}>{t("postgresql_dashboard")}</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Min Seconds Input */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <label htmlFor="minSec" style={{ fontSize: 14, color: theme.text.secondary }}>{t("min_seconds")}</label>
          <input
            id="minSec"
            type="number"
            value={minSec}
            min={1}
            onChange={(e) => onMinSecChange(Number(e.target.value) || 1)}
            style={{ 
              width: 90, 
              padding: "6px 8px", 
              border: `1px solid ${theme.border.default}`, 
              borderRadius: 4,
              backgroundColor: theme.bg.input,
              color: theme.text.primary,
            }}
          />
        </div>

        {/* Auto-refresh Toggle & Interval */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          alignItems: "center", 
          padding: "6px 12px", 
          border: `1px solid ${theme.border.default}`, 
          borderRadius: 8, 
          background: autoRefreshEnabled 
            ? (theme.isDark ? "#1e3a5f" : "#e3f2fd") 
            : theme.bg.secondary 
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14, color: theme.text.secondary }}>
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>{t("auto_refresh")}</span>
          </label>
          {autoRefreshEnabled && (
            <select
              value={autoRefreshInterval}
              onChange={(e) => onAutoRefreshIntervalChange(Number(e.target.value) as RefreshInterval)}
              style={{ 
                padding: "4px 8px", 
                border: `1px solid ${theme.border.default}`, 
                borderRadius: 4, 
                fontSize: 13, 
                cursor: "pointer",
                backgroundColor: theme.bg.input,
                color: theme.text.primary,
              }}
              disabled={!autoRefreshEnabled}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          style={{
            padding: "8px 12px",
            border: `1px solid ${theme.border.default}`,
            borderRadius: 8,
            cursor: "pointer",
            background: theme.bg.secondary,
            color: theme.text.primary,
            fontWeight: 500,
          }}
          title={t("refresh_tooltip")}
        >
          {t("refresh")}
        </button>
      </div>
    </header>
  );
};

