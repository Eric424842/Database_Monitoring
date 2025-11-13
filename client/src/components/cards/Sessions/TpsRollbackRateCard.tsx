// src/components/cards/Sessions/TpsRollbackRateCard.tsx
// TPS & Rollback Rate Card component

import React from "react";
import type { TpsRollbackRateRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface TpsRollbackRateCardProps {
  tpsRollbackRate: TpsRollbackRateRow[];
}

export const TpsRollbackRateCard: React.FC<TpsRollbackRateCardProps> = ({ tpsRollbackRate }) => {
  if (!tpsRollbackRate.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          TPS & Rollback Rate
        </span>
        <MetricTooltip
          title="TPS & Rollback Rate"
          description="Số transaction commit và rollback mỗi giây (TPS), cùng phần trăm rollback theo database."
          goodValue="Rollback % < 5% - Tỷ lệ rollback thấp, tốt"
          warningValue="Rollback % > 5% - Tỷ lệ rollback cao, cần kiểm tra"
          additionalInfo="Tỷ lệ rollback cao có thể do lỗi logic ứng dụng hoặc deadlock. Cần kiểm tra logs và transaction design."
        />
      </h2>
      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Database</th>
              <th style={{ ...th, textAlign: "right" }}>Commits</th>
              <th style={{ ...th, textAlign: "right" }}>Rollbacks</th>
              <th style={{ ...th, textAlign: "right" }}>TPS</th>
              <th style={{ ...th, textAlign: "right" }}>Rollback %</th>
              <th style={th}>Stats Reset</th>
            </tr>
          </thead>
          <tbody>
            {tpsRollbackRate.map((r, i) => {
              // Normalize numeric values (PostgreSQL may return as string)
              const tps = typeof r.tps === 'string' ? Number(r.tps) : r.tps;
              const rollbackPct = typeof r.rollback_pct === 'string' ? Number(r.rollback_pct) : r.rollback_pct;
              
              return (
                <tr key={i}>
                  <td style={td}>{r.database}</td>
                  <td style={{ ...td, textAlign: "right" }}>{r.xact_commit?.toLocaleString() ?? "-"}</td>
                  <td style={{ ...td, textAlign: "right" }}>{r.xact_rollback?.toLocaleString() ?? "-"}</td>
                  <td style={{ ...td, textAlign: "right" }}>{tps !== null && tps !== undefined ? tps.toFixed(2) : "-"}</td>
                  <td style={{ 
                    ...td, 
                    textAlign: "right",
                    color: rollbackPct !== null && rollbackPct !== undefined && rollbackPct > 5 ? "#d32f2f" : undefined
                  }}>
                    {rollbackPct !== null && rollbackPct !== undefined ? rollbackPct.toFixed(2) : "-"}%
                    {rollbackPct !== null && rollbackPct !== undefined && rollbackPct > 5 && (
                      <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠</span>
                    )}
                  </td>
                  <td style={td}>{r.stats_reset ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

