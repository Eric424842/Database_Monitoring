// src/components/cards/Locks/LockSummaryCard.tsx
// Lock Summary Card component

import React from "react";
import type { LockSummaryRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface LockSummaryCardProps {
  lockSummary: LockSummaryRow[];
}

export const LockSummaryCard: React.FC<LockSummaryCardProps> = ({ lockSummary }) => {
  if (!lockSummary.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Lock Summary
          {lockSummary.some(r => r.waiting > 0) && (
            <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ Waiting</span>
          )}
        </span>
        <MetricTooltip
          title="Lock Summary"
          description="Tổng hợp lock theo mode, phân biệt Granted (đã cấp phát) và Waiting (đang chờ). Lock waiting cao cho thấy nhiều transaction đang bị block."
          goodValue="Waiting = 0 - Không có lock đang chờ"
          warningValue="Waiting > 0 - Có lock đang chờ, cần kiểm tra blocking queries"
          additionalInfo="Lock waiting có thể làm chậm database. Nên kiểm tra long-running transactions và deadlock."
        />
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Mode</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Granted</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Waiting</th>
          </tr>
        </thead>
        <tbody>
          {lockSummary.map((r, i) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: "left" }}>{r.mode}</td>
              <td style={{ ...td, textAlign: "right", width: 120 }}>{r.granted}</td>
              <td style={{ ...td, textAlign: "right", width: 120 }}>
                {r.waiting}
                {r.waiting > 0 && (
                  <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



