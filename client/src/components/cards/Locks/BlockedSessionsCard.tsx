// src/components/cards/Locks/BlockedSessionsCard.tsx
// Blocked Sessions Card component

import React from "react";
import type { BlockedSessionsRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { formatDuration } from "../../../utils/formatters";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { exportToCSV, exportToJSON, copyToClipboard } from "../../../utils/export";

interface BlockedSessionsCardProps {
  blockedSessions: BlockedSessionsRow[];
}

export const BlockedSessionsCard: React.FC<BlockedSessionsCardProps> = ({ blockedSessions }) => {
  if (!blockedSessions.length) return null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
          <span>
            Blocked Sessions (top 20)
            <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ High</span>
          </span>
          <MetricTooltip
            title="Blocked Sessions"
            description="Các session đang bị block bởi lock từ session khác. Khi một transaction giữ lock quá lâu, các transaction khác phải chờ."
            goodValue="0 blocked sessions - Không có blocking"
            warningValue="> 0 blocked sessions - Có vấn đề về locking"
            additionalInfo="Blocked sessions làm chậm ứng dụng. Cần kiểm tra blocking queries và xem xét kill các long-running transactions đang giữ lock."
          />
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => exportToCSV(blockedSessions, `blocked-sessions-${new Date().toISOString().split("T")[0]}.csv`)}
            style={{
              padding: "6px 12px",
              border: "1px solid #4caf50",
              borderRadius: 6,
              cursor: "pointer",
              background: "#e8f5e9",
              color: "#2e7d32",
              fontSize: 13,
              fontWeight: 500,
            }}
            title="Export to CSV"
          >
            📥 CSV
          </button>
          <button
            onClick={() => exportToJSON(blockedSessions, `blocked-sessions-${new Date().toISOString().split("T")[0]}.json`)}
            style={{
              padding: "6px 12px",
              border: "1px solid #2196f3",
              borderRadius: 6,
              cursor: "pointer",
              background: "#e3f2fd",
              color: "#1976d2",
              fontSize: 13,
              fontWeight: 500,
            }}
            title="Export to JSON"
          >
            📥 JSON
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Blocked PID</th>
              <th style={th}>Blocked User</th>
              <th style={th}>Blocking PID</th>
              <th style={th}>Blocking User</th>
              <th style={th}>Blocked State</th>
              <th style={th}>Blocking State</th>
              <th style={th}>Duration</th>
              <th style={th}>Blocked Query</th>
              <th style={th}>Blocking Query</th>
            </tr>
          </thead>
          <tbody>
            {blockedSessions.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.blocked_pid}</td>
                <td style={td}>{r.blocked_user ?? "-"}</td>
                <td style={td}>{r.blocking_pid}</td>
                <td style={td}>{r.blocking_user ?? "-"}</td>
                <td style={td}>{r.blocked_state ?? "-"}</td>
                <td style={td}>{r.blocking_state ?? "-"}</td>
                <td style={td}>{formatDuration(r.blocked_duration)}</td>
                <td style={{ ...td, maxWidth: 300 }}>
                  <div style={{ position: "relative" }}>
                    <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
                      {r.blocked_query ? (r.blocked_query.length > 150 ? `${r.blocked_query.substring(0, 150)}...` : r.blocked_query) : "-"}
                    </code>
                    {r.blocked_query && r.blocked_query.length > 150 && (
                      <button
                        onClick={async () => {
                          const success = await copyToClipboard(r.blocked_query || "");
                          if (success) {
                            alert("Đã copy full query vào clipboard!");
                          } else {
                            alert("Không thể copy. Vui lòng thử lại.");
                          }
                        }}
                        style={{
                          marginLeft: 8,
                          padding: "2px 6px",
                          fontSize: 10,
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          background: "#f5f5f5",
                        }}
                        title="Copy Full Query"
                      >
                        Copy Full
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ ...td, maxWidth: 300 }}>
                  <div style={{ position: "relative" }}>
                    <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
                      {r.blocking_query ? (r.blocking_query.length > 150 ? `${r.blocking_query.substring(0, 150)}...` : r.blocking_query) : "-"}
                    </code>
                    {r.blocking_query && r.blocking_query.length > 150 && (
                      <button
                        onClick={async () => {
                          const success = await copyToClipboard(r.blocking_query || "");
                          if (success) {
                            alert("Đã copy full query vào clipboard!");
                          } else {
                            alert("Không thể copy. Vui lòng thử lại.");
                          }
                        }}
                        style={{
                          marginLeft: 8,
                          padding: "2px 6px",
                          fontSize: 10,
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          cursor: "pointer",
                          background: "#f5f5f5",
                        }}
                        title="Copy Full Query"
                      >
                        Copy Full
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

