// Lock Overview per Database Card component

import React from "react";
import type { LockOverviewPerDbRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface LockOverviewPerDbCardProps {
  lockOverviewPerDb: LockOverviewPerDbRow[];
}

export const LockOverviewPerDbCard: React.FC<LockOverviewPerDbCardProps> = ({ lockOverviewPerDb }) => {
  if (!lockOverviewPerDb.length) return null;

  const hasWaiting = lockOverviewPerDb.some(r => r.waiting_locks > 0);

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Lock Overview per Database
          {hasWaiting && (
            <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ Waiting</span>
          )}
        </span>
        <MetricTooltip
          title="Lock Overview per Database"
          description="Tổng quan locks theo từng database, phân biệt waiting locks (đang chờ) và held locks (đang giữ). Giúp xác định database nào đang có vấn đề về locking."
          goodValue="Waiting Locks = 0 - Không có lock đang chờ"
          warningValue="Waiting Locks > 0 - Có lock đang chờ, cần kiểm tra blocking queries trong database đó"
          additionalInfo="Database có nhiều waiting locks có thể đang gặp vấn đề về performance. Nên kiểm tra long-running transactions và deadlock trong database đó."
        />
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={th}>Database</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Waiting</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Held</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lockOverviewPerDb.map((r, i) => {
            const waitingPercent = r.total_locks > 0 
              ? ((r.waiting_locks / r.total_locks) * 100).toFixed(1)
              : "0.0";
            
            return (
              <tr key={i}>
                <td style={td}>{r.database}</td>
                <td style={{ ...td, textAlign: "right", width: 120 }}>
                  {r.waiting_locks}
                  {r.waiting_locks > 0 && (
                    <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠</span>
                  )}
                </td>
                <td style={{ ...td, textAlign: "right", width: 120 }}>{r.held_locks}</td>
                <td style={{ ...td, textAlign: "right", width: 120 }}>
                  {r.total_locks}
                  {r.waiting_locks > 0 && (
                    <span style={{ color: "#666", fontSize: 12, marginLeft: 4 }}>
                      ({waitingPercent}%)
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
