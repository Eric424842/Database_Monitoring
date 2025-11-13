// src/components/cards/Performance/TableSizesCard.tsx
// Table Sizes Card component

import React from "react";
import type { TableSizeRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { exportToCSV, exportToJSON } from "../../../utils/export";

interface TableSizesCardProps {
  tableSizes: TableSizeRow[];
}

export const TableSizesCard: React.FC<TableSizesCardProps> = ({ tableSizes }) => {
  if (!tableSizes.length) return null;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Largest Table/Index Sizes (top 10)</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => exportToCSV(tableSizes, `table-sizes-${new Date().toISOString().split("T")[0]}.csv`)}
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
            onClick={() => exportToJSON(tableSizes, `table-sizes-${new Date().toISOString().split("T")[0]}.json`)}
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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Schema</th>
              <th style={th}>Table</th>
              <th style={th}>Total Size</th>
              <th style={th}>Table Size</th>
              <th style={th}>Index Size</th>
            </tr>
          </thead>
          <tbody>
            {tableSizes.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.schemaname}</td>
                <td style={td}>{r.relname}</td>
                <td style={td}><strong>{r.total_size}</strong></td>
                <td style={td}>{r.table_size}</td>
                <td style={td}>{r.index_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

