// src/components/cards/WALCheckpointIO/TempFilesCard.tsx
// Temp Files / Bytes per DB Card component

import React from "react";
import type { TempFilesRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { formatNumber } from "../../../utils/formatters";

interface TempFilesCardProps {
  tempFiles: TempFilesRow[];
  currentDatabase?: string;
}

export const TempFilesCard: React.FC<TempFilesCardProps> = ({ tempFiles, currentDatabase }) => {
  // Filter chỉ hiển thị database đang connect nếu có currentDatabase
  const filteredTempFiles = currentDatabase
    ? tempFiles.filter((db) => db.datname === currentDatabase)
    : tempFiles;

  if (!filteredTempFiles.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>Temp Files / Bytes per DB</span>
        <MetricTooltip
          title="Temp Files / Bytes per DB"
          description="Thống kê về temp files và temp bytes theo database. Temp files được tạo khi query cần sort hoặc hash nhưng không đủ work_mem."
          goodValue="Temp files = 0 - Queries đủ memory"
          warningValue="Temp files > 0 - Có thể cần tăng work_mem"
          additionalInfo="Temp files nhiều cho thấy nhiều query đang spill ra disk, làm chậm performance. Nên xem xét tăng work_mem hoặc tối ưu query."
        />
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Database</th>
              <th style={{ ...th, textAlign: "right" }}>Temp Files</th>
              <th style={{ ...th, textAlign: "right" }}>Temp Bytes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTempFiles.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.datname}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  {r.temp_files !== null && r.temp_files !== undefined ? r.temp_files.toLocaleString() : "-"}
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  {r.temp_bytes !== null && r.temp_bytes !== undefined
                    ? formatNumber(r.temp_bytes)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

