// src/components/OverviewSection.tsx
// Overview Dashboard - Tổng quan nhanh về database

import React from "react";
import type { OverviewResponse, ConnectionUsageRow, DeadlocksRow } from "../../types";
import { formatPercent } from "../../utils/formatters";
import { MetricTooltip } from "../ui/Shared/MetricTooltip";
import { useThemeStyles } from "../../utils/themeStyles";
import { useTranslation } from "../../utils/i18n";

interface OverviewSectionProps {
  overview: OverviewResponse | null;
  connectionUsage: ConnectionUsageRow | null;
  deadlocks: DeadlocksRow[];
}

// Card style sẽ được tạo động trong component
const metricValueStyle = (theme: ReturnType<typeof useThemeStyles>): React.CSSProperties => ({
  fontSize: 28,
  fontWeight: 700,
  color: theme.text.primary,
  lineHeight: 1.2,
});

const metricLabelStyle = (theme: ReturnType<typeof useThemeStyles>): React.CSSProperties => ({
  fontSize: 13,
  color: theme.text.secondary,
  marginTop: 4,
});

const badgeStyle = (color: string, isDark: boolean = false): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: color === "red" 
    ? (isDark ? "#7f1d1d" : "#ffebee")
    : (isDark ? "#78350f" : "#fff3e0"),
  color: color === "red"
    ? (isDark ? "#fca5a5" : "#c62828")
    : (isDark ? "#fbbf24" : "#e65100"),
});

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  overview,
  connectionUsage,
  deadlocks,
}) => {
  const theme = useThemeStyles();
  const { t } = useTranslation();
  
  // Tính toán alerts
  const alerts: Array<{ message: string; severity: "red" | "orange" }> = [];

  // Connection Usage > 80%
  if (connectionUsage?.used_percent && connectionUsage.used_percent > 80) {
    alerts.push({
      message: `Connection Usage: ${formatPercent(connectionUsage.used_percent)}`,
      severity: connectionUsage.used_percent > 90 ? "red" : "orange",
    });
  }

  // Cache Hit < 95%
  if (overview?.cacheHitPercent && overview.cacheHitPercent < 95) {
    alerts.push({
      message: `Cache Hit: ${formatPercent(overview.cacheHitPercent)}`,
      severity: overview.cacheHitPercent < 90 ? "red" : "orange",
    });
  }

  // Deadlocks > 0
  const totalDeadlocks = deadlocks.reduce((sum, d) => sum + (d.deadlocks || 0), 0);
  if (totalDeadlocks > 0) {
    alerts.push({
      message: `${totalDeadlocks} Deadlock${totalDeadlocks > 1 ? "s" : ""}`,
      severity: "red",
    });
  }

  // Tính tổng kết số liệu
  const totalConnections = overview?.connectionsByState?.reduce((sum, c) => sum + c.count, 0) || 0;
  const activeConnections = overview?.connectionsByState?.find(c => c.state === "active")?.count || 0;

  return (
    <section style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: theme.text.primary }}>
        📊 {t("overview_dashboard")}
      </h1>

      {/* Alerts Bar */}
      {alerts.length > 0 && (
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginBottom: 16, 
          flexWrap: "wrap",
          padding: 12,
          backgroundColor: theme.isDark ? "#78350f" : "#fff3cd",
          borderRadius: 8,
          border: `1px solid ${theme.isDark ? "#92400e" : "#ffc107"}`,
        }}>
          <span style={{ fontWeight: 600, color: theme.isDark ? "#fbbf24" : "#856404" }}>⚠ Cảnh báo:</span>
          {alerts.map((alert, idx) => (
            <span key={idx} style={badgeStyle(alert.severity, theme.isDark)}>
              {alert.severity === "red" ? "🔴" : "⚠"} {alert.message}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Connections by State */}
        <div style={theme.cardStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: theme.text.primary }}>
            🔌 {t("connections")}
            <MetricTooltip
              title={t("tooltip_connections_title")}
              description={t("tooltip_connections_desc")}
              goodValue={t("tooltip_connections_good")}
              warningValue={t("tooltip_connections_warn")}
              additionalInfo=""
            />
          </h2>
          {!overview ? (
            <p style={{ color: theme.text.secondary, fontSize: 13 }}>{t("loading")}</p>
          ) : overview.connectionsByState?.length ? (
            <div>
              {overview.connectionsByState.map((row, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: idx < overview.connectionsByState.length - 1 ? `1px dashed ${theme.border.light}` : "none" }}>
                  <span style={{ fontSize: 13, color: theme.text.secondary }}>{row.state}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary }}>{row.count}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border.light}`, fontSize: 12, color: theme.text.secondary }}>
                {t("total")}: <strong style={{ color: theme.text.primary }}>{totalConnections}</strong> | {t("active")}: <strong style={{ color: theme.text.primary }}>{activeConnections}</strong>
              </div>
            </div>
          ) : (
            <p style={{ color: theme.text.secondary, fontSize: 13 }}>{t("no_connections")}</p>
          )}
        </div>

        {/* Connection Usage */}
        <div style={theme.cardStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: theme.text.primary }}>
            📈 {t("connection_usage")}
            {connectionUsage?.used_percent && connectionUsage.used_percent > 80 && (
              <span style={badgeStyle(connectionUsage.used_percent > 90 ? "red" : "orange", theme.isDark)}>
                {connectionUsage.used_percent > 90 ? "🔴" : "⚠"} {t("high")}
              </span>
            )}
            <MetricTooltip
              title={t("tooltip_connection_usage_title")}
              description={t("tooltip_connection_usage_desc")}
              goodValue={t("tooltip_connection_usage_good")}
              warningValue={t("tooltip_connection_usage_warn")}
              additionalInfo={t("tooltip_connection_usage_info")}
            />
          </h2>
          {!connectionUsage ? (
            <p style={{ color: theme.text.secondary, fontSize: 13 }}>{t("loading")}</p>
          ) : (
            <div>
              <div style={metricValueStyle(theme)}>
                {formatPercent(connectionUsage.used_percent, 1)}
              </div>
              <div style={metricLabelStyle(theme)}>
                {connectionUsage.current_connections} / {connectionUsage.max_connections} connections
              </div>
            </div>
          )}
        </div>

        {/* Cache Hit */}
        <div style={theme.cardStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: theme.text.primary }}>
            💾 {t("cache_hit")}
            {overview?.cacheHitPercent && overview.cacheHitPercent < 95 && (
              <span style={badgeStyle(overview.cacheHitPercent < 90 ? "red" : "orange", theme.isDark)}>
                {overview.cacheHitPercent < 90 ? "🔴" : "⚠"} {t("low")}
              </span>
            )}
            <MetricTooltip
              title={t("tooltip_cache_hit_title")}
              description={t("tooltip_cache_hit_desc")}
              goodValue={t("tooltip_cache_hit_good")}
              warningValue={t("tooltip_cache_hit_warn")}
              additionalInfo={t("tooltip_cache_hit_info")}
            />
          </h2>
          {!overview ? (
            <p style={{ color: theme.text.secondary, fontSize: 13 }}>{t("loading")}</p>
          ) : (
            <div>
              <div style={metricValueStyle(theme)}>
                {formatPercent(overview.cacheHitPercent, 1)}
              </div>
              <div style={metricLabelStyle(theme)}>{t("cache_performance")}</div>
            </div>
          )}
        </div>

        {/* Deadlocks */}
        <div style={theme.cardStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: theme.text.primary }}>
            🔒 {t("stability")}
            {totalDeadlocks > 0 && (
              <span style={badgeStyle("red", theme.isDark)}>🔴 {t("alert")}</span>
            )}
            <MetricTooltip
              title={t("tooltip_stability_title")}
              description={t("tooltip_stability_desc")}
              goodValue={t("tooltip_stability_good")}
              warningValue={t("tooltip_stability_warn")}
              additionalInfo={t("tooltip_stability_info")}
            />
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: theme.text.secondary, marginBottom: 4 }}>{t("deadlocks")}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: totalDeadlocks > 0 ? "#c62828" : "#4caf50" }}>
                {totalDeadlocks}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

