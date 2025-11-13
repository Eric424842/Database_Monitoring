// src/components/cards/Performance/SeqVsIdxScansCard.tsx
// Sequential vs Index Scans Card component

import React from "react";
import type { SeqVsIdxScanRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { formatPercent } from "../../../utils/formatters";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { exportToCSV, exportToJSON } from "../../../utils/export";

interface SeqVsIdxScansCardProps {
  seqVsIdxScans: SeqVsIdxScanRow[];
}

export const SeqVsIdxScansCard: React.FC<SeqVsIdxScansCardProps> = ({ seqVsIdxScans }) => {
  if (!seqVsIdxScans.length) return null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
          <span>Sequential vs Index Scans</span>
          <MetricTooltip
            title="Sequential vs Index Scans"
            description="Sequential scan quét toàn bộ bảng (chậm), Index scan sử dụng index để tìm nhanh (nhanh). Tỷ lệ này cho biết bảng nào đang dùng nhiều sequential scan."
            goodValue="Index Usage > 80% - Hầu hết query dùng index"
            warningValue="Index Usage < 50% - Nhiều sequential scan, cần tạo index"
            additionalInfo="Bảng có nhiều sequential scan cần được phân tích để tạo index phù hợp cho các query thường dùng."
          />
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => exportToCSV(seqVsIdxScans, `seq-vs-index-scans-${new Date().toISOString().split("T")[0]}.csv`)}
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
            onClick={() => exportToJSON(seqVsIdxScans, `seq-vs-index-scans-${new Date().toISOString().split("T")[0]}.json`)}
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
      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ textAlign: "center" }}>
              <th style={th}>Schema</th>
              <th style={th}>Table</th>
              <th style={th}>Seq Scan</th>
              <th style={th}>Idx Scan</th>
              <th style={th}>Idx Usage %</th>
              <th style={th}>Live Tuples</th>
            </tr>
          </thead>
          <tbody>
            {seqVsIdxScans.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, textAlign: "center" }}>{r.schemaname}</td>
                <td style={{ ...td, textAlign: "center" }}>{r.relname}</td>
                <td style={{ ...td, textAlign: "center" }}>{r.seq_scan ?? "-"}</td>
                <td style={{ ...td, textAlign: "center" }}>{r.idx_scan ?? "-"}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  {formatPercent(r.idx_usage_percent, 2)}
                  {r.idx_usage_percent !== null && 
                   r.idx_usage_percent !== undefined && 
                   Number(r.idx_usage_percent) < 50 && (
                    <span style={{ color: "#f57c00", marginLeft: 8 }}>⚠ Low</span>
                  )}
                </td>
                <td style={{ ...td, textAlign: "center" }}>{r.n_live_tup ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

