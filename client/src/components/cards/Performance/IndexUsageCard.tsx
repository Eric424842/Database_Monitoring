// src/components/cards/Performance/IndexUsageCard.tsx
// Index Usage Card component

import React from "react";
import type { IndexUsageRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { formatPercent } from "../../../utils/formatters";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface IndexUsageCardProps {
  indexUsage: IndexUsageRow[];
}

export const IndexUsageCard: React.FC<IndexUsageCardProps> = ({ indexUsage }) => {
  if (!indexUsage.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Index Usage
          {indexUsage.some(r => r.idx_usage !== null && r.idx_usage !== undefined && Number(r.idx_usage) < 50) && (
            <span style={{ color: "#f57c00", marginLeft: 8 }}>⚠ Low</span>
          )}
        </span>
        <MetricTooltip
          title="Index Usage Percentage"
          description="Tỷ lệ sử dụng index scan so với sequential scan. Sequential scan quét toàn bộ bảng nên chậm hơn index scan."
          goodValue="> 80% - Index được sử dụng tốt"
          warningValue="< 50% - Nhiều sequential scan, cần tạo index"
          additionalInfo="Index Usage = idx_scan / (idx_scan + seq_scan) * 100%. Giá trị thấp cho thấy query chưa tối ưu."
        />
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={th}>Table</th>
            <th style={{ ...th, textAlign: "center" }}>idx_scan</th>
            <th style={{ ...th, textAlign: "center" }}>seq_scan</th>
            <th style={{ ...th, textAlign: "center" }}>Idx Usage %</th>
          </tr>
        </thead>
        <tbody>
          {indexUsage.map((r, i) => (
            <tr key={i}>
              <td style={td}>{r.relname}</td>
              <td style={{ ...td, textAlign: "center" }}>{r.idx_scan ?? "-"}</td>
              <td style={{ ...td, textAlign: "center" }}>{r.seq_scan ?? "-"}</td>
              <td style={{ ...td, textAlign: "center" }}>
                {formatPercent(r.idx_usage)}
                {r.idx_usage !== null && 
                 r.idx_usage !== undefined && 
                 Number(r.idx_usage) < 50 && (
                  <span style={{ color: "#f57c00", marginLeft: 8 }}>⚠ Low</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



