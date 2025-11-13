// src/components/cards/Sessions/PerDbCacheHitCard.tsx
// Per-DB Cache Hit % Card component

import React from "react";
import type { PerDbCacheHitRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface PerDbCacheHitCardProps {
  perDbCacheHit: PerDbCacheHitRow[];
}

export const PerDbCacheHitCard: React.FC<PerDbCacheHitCardProps> = ({ perDbCacheHit }) => {
  if (!perDbCacheHit.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Per-Database Cache Hit %
        </span>
        <MetricTooltip
          title="Per-Database Cache Hit %"
          description="Phân tích hiệu suất cache theo từng database. Cache hit % cao nghĩa là hầu hết dữ liệu được đọc từ memory thay vì disk."
          goodValue="> 95% - Cache hoạt động tốt"
          warningValue="< 95% - Cache hit thấp, cần kiểm tra shared_buffers"
          additionalInfo="Cache hit thấp có thể do shared_buffers quá nhỏ hoặc workload quá lớn. Nên tăng shared_buffers nếu có thể."
        />
      </h2>
      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Database</th>
              <th style={{ ...th, textAlign: "right" }}>Cache Hit %</th>
              <th style={{ ...th, textAlign: "right" }}>Blocks Hit</th>
              <th style={{ ...th, textAlign: "right" }}>Blocks Read</th>
            </tr>
          </thead>
          <tbody>
            {perDbCacheHit.map((r, i) => {
              // Normalize numeric value (PostgreSQL may return as string)
              const cacheHitPct = typeof r.cache_hit_pct === 'string' ? Number(r.cache_hit_pct) : r.cache_hit_pct;
              
              return (
                <tr key={i}>
                  <td style={td}>{r.database}</td>
                  <td style={{ 
                    ...td, 
                    textAlign: "right",
                    color: cacheHitPct !== null && cacheHitPct !== undefined && cacheHitPct < 95 ? "#f57c00" : undefined
                  }}>
                    {cacheHitPct !== null && cacheHitPct !== undefined ? cacheHitPct.toFixed(2) : "-"}%
                    {cacheHitPct !== null && cacheHitPct !== undefined && cacheHitPct < 95 && (
                      <span style={{ color: "#f57c00", marginLeft: 8 }}>⚠</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>{r.blks_hit?.toLocaleString() ?? "-"}</td>
                  <td style={{ ...td, textAlign: "right" }}>{r.blks_read?.toLocaleString() ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

