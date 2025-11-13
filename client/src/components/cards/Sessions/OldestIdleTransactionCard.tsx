// src/components/cards/Sessions/OldestIdleTransactionCard.tsx
// Oldest Idle-in-Transaction Card component

import React from "react";
import type { OldestIdleTransactionRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { formatDuration } from "../../../utils/formatters";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface OldestIdleTransactionCardProps {
  oldestIdleTransaction: OldestIdleTransactionRow[];
}

export const OldestIdleTransactionCard: React.FC<OldestIdleTransactionCardProps> = ({ oldestIdleTransaction }) => {
  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Oldest Idle-in-Transaction (top 10)
        </span>
        <MetricTooltip
          title="Oldest Idle-in-Transaction"
          description="Những session đang ở trạng thái 'idle in transaction' lâu nhất. Các session này có thể đang giữ lock và gây block các query khác."
          goodValue="0 sessions - Không có session idle in transaction"
          warningValue="> 0 sessions - Có nguy cơ giữ lock, gây block"
          additionalInfo="Session idle in transaction lâu có thể giữ lock và block các query khác. Nên kill các session này nếu không cần thiết."
        />
      </h2>
      {oldestIdleTransaction.length === 0 ? (
        <div style={{ padding: "16px", textAlign: "center", color: "#4caf50" }}>
          ✓ Không có session nào ở trạng thái 'idle in transaction'
        </div>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={th}>Database</th>
                <th style={th}>PID</th>
                <th style={th}>User</th>
                <th style={th}>State</th>
                <th style={th}>Idle Duration</th>
                <th style={th}>Current Query</th>
              </tr>
            </thead>
            <tbody>
              {oldestIdleTransaction.map((r, i) => (
                <tr key={i}>
                  <td style={td}>{r.database}</td>
                  <td style={td}>{r.pid}</td>
                  <td style={td}>{r.user ?? "-"}</td>
                  <td style={td}>{r.state ?? "-"}</td>
                  <td style={td}>{formatDuration(r.idle_duration)}</td>
                  <td style={{ ...td, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.current_query ? (r.current_query.length > 100 ? r.current_query.substring(0, 100) + "..." : r.current_query) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

