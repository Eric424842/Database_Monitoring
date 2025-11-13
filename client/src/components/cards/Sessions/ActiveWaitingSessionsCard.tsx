// src/components/cards/Sessions/ActiveWaitingSessionsCard.tsx
// Active vs Waiting Sessions Card component

import React from "react";
import type { ActiveWaitingSessionsRow } from "../../../types";
import { cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface ActiveWaitingSessionsCardProps {
  activeWaitingSessions: ActiveWaitingSessionsRow | null;
}

export const ActiveWaitingSessionsCard: React.FC<ActiveWaitingSessionsCardProps> = ({ activeWaitingSessions }) => {
  if (!activeWaitingSessions) return null;

  const { active_sessions, waiting_sessions, idle_sessions, total_sessions } = activeWaitingSessions;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>
          Active vs Waiting Sessions
        </span>
        <MetricTooltip
          title="Active vs Waiting Sessions"
          description="Đếm số session đang chạy (active), đang chờ lock/I/O (waiting), và idle trong database hiện tại."
          goodValue="Waiting = 0 - Không có session đang chờ"
          warningValue="Waiting > 0 - Có session đang chờ, có thể có vấn đề"
          additionalInfo="Session đang chờ có thể do lock contention hoặc I/O chậm. Cần kiểm tra wait events và blocking queries."
        />
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#e3f2fd", 
          borderRadius: 8,
          border: "1px solid #90caf9"
        }}>
          <div style={{ fontSize: 14, color: "#1976d2", marginBottom: 4 }}>Active Sessions</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1976d2" }}>{active_sessions}</div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: waiting_sessions > 0 ? "#ffebee" : "#e8f5e9", 
          borderRadius: 8,
          border: `1px solid ${waiting_sessions > 0 ? "#ef5350" : "#81c784"}`
        }}>
          <div style={{ fontSize: 14, color: waiting_sessions > 0 ? "#d32f2f" : "#388e3c", marginBottom: 4 }}>
            Waiting Sessions
            {waiting_sessions > 0 && <span style={{ marginLeft: 8 }}>⚠</span>}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: waiting_sessions > 0 ? "#d32f2f" : "#388e3c" }}>
            {waiting_sessions}
          </div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#f3e5f5", 
          borderRadius: 8,
          border: "1px solid #ce93d8"
        }}>
          <div style={{ fontSize: 14, color: "#7b1fa2", marginBottom: 4 }}>Idle Sessions</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#7b1fa2" }}>{idle_sessions}</div>
        </div>
        <div style={{ 
          padding: 16, 
          backgroundColor: "#fff3e0", 
          borderRadius: 8,
          border: "1px solid #ffb74d"
        }}>
          <div style={{ fontSize: 14, color: "#f57c00", marginBottom: 4 }}>Total Sessions</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f57c00" }}>{total_sessions}</div>
        </div>
      </div>
    </div>
  );
};

