// src/components/cards/Locks/WaitByLockModeCard.tsx
// Wait by Lock Mode Card component

import React from "react";
import type { WaitByLockModeRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface WaitByLockModeCardProps {
  waitByLockMode: WaitByLockModeRow[];
}

export const WaitByLockModeCard: React.FC<WaitByLockModeCardProps> = ({ waitByLockMode }) => {
  if (!waitByLockMode.length) return null;

  const hasWaiting = waitByLockMode.some(r => r.waiting > 0);

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Wait by Lock Mode
          {hasWaiting && (
            <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ Waiting</span>
          )}
        </span>
        <MetricTooltip
         title="Wait by Lock Mode"
         description="Phân phối locks đang chờ (waiting) và đang giữ (held) theo lock type và mode. Lock waiting cao cho thấy nhiều transaction đang bị block."
         goodValue="Waiting = 0 - Không có lock đang chờ"
         warningValue="Waiting > 0 - Có lock đang chờ, cần kiểm tra blocking queries"
         additionalInfo="Lock waiting có thể làm chậm database. Nên kiểm tra long-running transactions và deadlock."
/>
</h2>
<table style={{ width: "100%", borderCollapse: "collapse" }}>
<thead>
<tr style={{ textAlign: "left" }}>
  <th style={th}>Lock Type</th>
  <th style={th}>Mode</th>
  <th style={{ ...th, textAlign: "right", width: 120 }}>Waiting</th>
  <th style={{ ...th, textAlign: "right", width: 120 }}>Held</th>
</tr>
</thead>
<tbody>
{waitByLockMode.map((r, i) => (
  <tr key={i}>
    <td style={td}>{r.locktype}</td>
    <td style={td}>{r.mode}</td>
    <td style={{ ...td, textAlign: "right", width: 120 }}>
      {r.waiting}
      {r.waiting > 0 && (
        <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠</span>
      )}
    </td>
    <td style={{ ...td, textAlign: "right", width: 120 }}>{r.held}</td>
  </tr>
))}
</tbody>
</table>
</div>
);
};
