// src/components/cards/Locks/DeadlocksCard.tsx
// Deadlocks Card component

import React from "react";
import type { DeadlocksRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface DeadlocksCardProps {
  deadlocks: DeadlocksRow[];
}

export const DeadlocksCard: React.FC<DeadlocksCardProps> = ({ deadlocks }) => {
  if (!deadlocks.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Deadlocks
          {deadlocks.some(r => r.deadlocks > 0) && (
            <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ High</span>
          )}
        </span>
        <MetricTooltip
          title="Deadlocks"
          description="Số lượng deadlock đã xảy ra kể từ khi stats được reset. Deadlock xảy ra khi 2 transaction chờ nhau, PostgreSQL sẽ rollback một trong hai."
          goodValue="0 - Không có deadlock"
          warningValue="> 0 - Có vấn đề về transaction design"
          additionalInfo="Deadlock làm chậm ứng dụng và có thể gây lỗi cho user. Cần kiểm tra logic transaction và thứ tự lock."
        />
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Database</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Deadlocks</th>
          </tr>
        </thead>
        <tbody>
          {deadlocks.map((r, i) => (
            <tr key={i}>
              <td style={{ ...td, textAlign: "left" }}>{r.datname}</td>
              <td style={{ ...td, textAlign: "right", width: 120 }}>
                {r.deadlocks}
                {r.deadlocks > 0 && (
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



