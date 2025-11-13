// src/components/ui/MetricTooltip.tsx
// Component tooltip để hiển thị chú giải cho các thông số

import React, { useState } from "react";
import { useTranslation } from "../../../utils/i18n";
import { useThemeStyles } from "../../../utils/themeStyles";

interface MetricTooltipProps {
  title: string;
  description: string;
  goodValue?: string;
  warningValue?: string;
  additionalInfo?: string;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({
  title,
  description,
  goodValue,
  warningValue,
  additionalInfo,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();
  const theme = useThemeStyles();

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 4 }}>
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          cursor: "help",
          color: "#2196f3",
          fontSize: 14,
          fontWeight: "bold",
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid #2196f3",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e3f2fd",
        }}
        title={title}
      >
        ?
      </span>
      {isVisible && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            padding: 12,
            backgroundColor: theme.bg.card,
            border: `1px solid ${theme.border.default}`,
            borderRadius: 8,
            boxShadow: theme.isDark ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: 280,
            maxWidth: 350,
            fontSize: 13,
            lineHeight: 1.6,
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, color: theme.text.primary }}>{title}</div>
          <div style={{ color: theme.text.secondary, marginBottom: 8 }}>{description}</div>
          {goodValue && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: "#4caf50", fontWeight: 600 }}>{t("tooltip_good_value")} </span>
              <span style={{ color: theme.text.primary }}>{goodValue}</span>
            </div>
          )}
          {warningValue && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: "#f57c00", fontWeight: 600 }}>{t("tooltip_warning")} </span>
              <span style={{ color: theme.text.primary }}>{warningValue}</span>
            </div>
          )}
          {additionalInfo && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border.light}`, color: theme.text.muted, fontSize: 12 }}>
              {additionalInfo}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 12,
              height: 12,
              backgroundColor: theme.bg.card,
              borderRight: `1px solid ${theme.border.default}`,
              borderBottom: `1px solid ${theme.border.default}`,
            }}
          />
        </div>
      )}
    </span>
  );
};

// Helper component để wrap metric title với tooltip
interface MetricTitleWithTooltipProps {
  title: string;
  tooltipTitle: string;
  tooltipDescription: string;
  goodValue?: string;
  warningValue?: string;
  additionalInfo?: string;
}

export const MetricTitleWithTooltip: React.FC<MetricTitleWithTooltipProps> = ({
  title,
  tooltipTitle,
  tooltipDescription,
  goodValue,
  warningValue,
  additionalInfo,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span>{title}</span>
      <MetricTooltip
        title={tooltipTitle}
        description={tooltipDescription}
        goodValue={goodValue}
        warningValue={warningValue}
        additionalInfo={additionalInfo}
      />
    </div>
  );
};

