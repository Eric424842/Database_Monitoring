// src/components/cards/Sessions/LongRunningCard.tsx
// Long running queries Card component

import React from "react";
import type { LongRunningItem } from "../../../types";
import { th, td } from "../../../utils/styles";
import { formatDate } from "../../../utils/formatters";
import { exportToCSV, exportToJSON } from "../../../utils/export";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface LongRunningSectionProps {
  longRunning: LongRunningItem[];
  minSec: number;
}

export const LongRunningSection: React.FC<LongRunningSectionProps> = ({ longRunning, minSec }) => {
  return (
    <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
          <span>Long-running queries (≥ {minSec}s)</span>
          <MetricTooltip
            title="Long-running Queries"
            description="Các queries đang chạy lâu hơn ngưỡng được chỉ định. Query chạy lâu có thể làm chậm database và tốn tài nguyên."
            goodValue="0 queries - Không có query dài"
            warningValue="> 0 queries - Cần kiểm tra và tối ưu"
            additionalInfo="Query chạy lâu có thể do thiếu index, query chưa tối ưu, hoặc lock conflict. Nên kiểm tra execution plan và xem xét kill nếu cần."
          />
        </h2>
        {longRunning.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => exportToCSV(longRunning, `long-running-${new Date().toISOString().split("T")[0]}.csv`)}
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
              onClick={() => exportToJSON(longRunning, `long-running-${new Date().toISOString().split("T")[0]}.json`)}
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
        )}
      </div>

      {!longRunning.length ? (
        <p style={{ color: "#666" }}>Không có truy vấn dài đang chạy.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={th}>PID</th>
                <th style={th}>User</th>
                <th style={th}>DB</th>
                <th style={th}>State</th>
                <th style={th}>Duration (s)</th>
                <th style={th}>Started At</th>
                <th style={th}>Query</th>
              </tr>
            </thead>
            <tbody>
              {longRunning.map((r, idx) => (
                <tr key={idx}>
                  <td style={td}>{r.pid ?? "-"}</td>
                  <td style={td}>{r.user ?? "-"}</td>
                  <td style={td}>{r.db ?? "-"}</td>
                  <td style={td}>{r.state ?? "-"}</td>
                  <td style={td}>{r.durationSec ?? "-"}</td>
                  <td style={td}>{formatDate(r.startedAt)}</td>
                  <td style={{ ...td, maxWidth: 500 }}>
                    <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {r.query ?? "-"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

