// src/components/cards/WALCheckpointIO/CheckpointsCard.tsx
// Checkpoints & bgwriter Card component

import React from "react";
import type { CheckpointsRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { formatNumber } from "../../../utils/formatters";

interface CheckpointsCardProps {
  checkpoints: CheckpointsRow | null;
}

export const CheckpointsCard: React.FC<CheckpointsCardProps> = ({ checkpoints }) => {
  if (!checkpoints) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>Checkpoints & bgwriter</span>
        <MetricTooltip
          title="Checkpoints & bgwriter"
          description="Thống kê về checkpoints và background writer. Checkpoint là quá trình ghi tất cả dirty pages từ shared buffers ra disk."
          goodValue="Checkpoints đều đặn - Hệ thống hoạt động tốt"
          warningValue="Checkpoints quá thường xuyên - Có thể cần điều chỉnh checkpoint_timeout"
          additionalInfo="Timed checkpoints là các checkpoint theo lịch (timeout). Requested checkpoints là các checkpoint được yêu cầu thủ công hoặc do WAL đầy. Write time và sync time cho biết thời gian I/O trong checkpoint."
        />
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Metric</th>
              <th style={{ ...th, textAlign: "right" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>Timed Checkpoints</td>
              <td style={{ ...td, textAlign: "right" }}>{checkpoints.num_timed?.toLocaleString() ?? "-"}</td>
            </tr>
            <tr>
              <td style={td}>Requested Checkpoints</td>
              <td style={{ ...td, textAlign: "right" }}>{checkpoints.num_requested?.toLocaleString() ?? "-"}</td>
            </tr>
            <tr>
              <td style={td}>Checkpoints Done</td>
              <td style={{ ...td, textAlign: "right" }}>{checkpoints.num_done?.toLocaleString() ?? "-"}</td>
            </tr>
            <tr>
              <td style={td}>Write Time (ms)</td>
              <td style={{ ...td, textAlign: "right" }}>
                {checkpoints.write_time !== null && checkpoints.write_time !== undefined
                  ? formatNumber(checkpoints.write_time)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>Sync Time (ms)</td>
              <td style={{ ...td, textAlign: "right" }}>
                {checkpoints.sync_time !== null && checkpoints.sync_time !== undefined
                  ? formatNumber(checkpoints.sync_time)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>Buffers Written</td>
              <td style={{ ...td, textAlign: "right" }}>
                {checkpoints.buffers_written !== null && checkpoints.buffers_written !== undefined
                  ? formatNumber(checkpoints.buffers_written)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>SLRU Written</td>
              <td style={{ ...td, textAlign: "right" }}>
                {checkpoints.slru_written !== null && checkpoints.slru_written !== undefined
                  ? formatNumber(checkpoints.slru_written)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>Stats Reset</td>
              <td style={{ ...td, textAlign: "right" }}>{checkpoints.stats_reset ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

