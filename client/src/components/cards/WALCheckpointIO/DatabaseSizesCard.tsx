// src/components/cards/WALCheckpointIO/DatabaseSizesCard.tsx
// Database Sizes Card component (for WAL/Checkpoint/I/O tab)

import React from "react";
import type { DbSizeRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface DatabaseSizesCardProps {
  dbSizes: DbSizeRow[];
  currentDatabase?: string;
}

export const DatabaseSizesCard: React.FC<DatabaseSizesCardProps> = ({ dbSizes, currentDatabase }) => {
  // Filter chỉ hiển thị database đang connect nếu có currentDatabase
  const filteredDbSizes = currentDatabase
    ? dbSizes.filter((db) => db.datname === currentDatabase)
    : dbSizes;

  if (!filteredDbSizes.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>Database Sizes (đối chiếu tăng trưởng)</span>
        <MetricTooltip
          title="Database Sizes"
          description="Kích thước của các database, dùng để đối chiếu tăng trưởng theo thời gian."
          goodValue="Tăng trưởng ổn định - Database hoạt động bình thường"
          warningValue="Tăng trưởng nhanh - Cần kiểm tra bloat hoặc dữ liệu không cần thiết"
          additionalInfo="Theo dõi kích thước database giúp phát hiện tăng trưởng bất thường và lập kế hoạch backup/cleanup."
        />
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Database</th>
              <th style={{ ...th, textAlign: "right" }}>Size</th>
            </tr>
          </thead>
          <tbody>
            {filteredDbSizes.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.datname}</td>
                <td style={{ ...td, textAlign: "right" }}>{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

