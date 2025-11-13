// src/components/cards/WALCheckpointIO/WALThroughputCard.tsx
// WAL Throughput Card component

import React from "react";
import type { WALThroughputRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { formatNumber } from "../../../utils/formatters";

interface WALThroughputCardProps {
  walThroughput: WALThroughputRow | null;
}

export const WALThroughputCard: React.FC<WALThroughputCardProps> = ({ walThroughput }) => {
  if (!walThroughput) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>WAL Throughput (PG13+)</span>
        <MetricTooltip
          title="WAL Throughput"
          description="Write-Ahead Logging (WAL) throughput metrics. WAL là cơ chế đảm bảo tính nhất quán dữ liệu trong PostgreSQL."
          goodValue="WAL bytes/sec ổn định - Hệ thống hoạt động bình thường"
          warningValue="WAL bytes/sec quá cao - Có thể do write workload lớn"
          additionalInfo="WAL records là số lượng WAL records được ghi. WAL FPI (Full Page Images) là số lượng full page images. WAL bytes là tổng dung lượng WAL đã ghi."
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
              <td style={td}>WAL Records</td>
              <td style={{ ...td, textAlign: "right" }}>{walThroughput.wal_records?.toLocaleString() ?? "-"}</td>
            </tr>
            <tr>
              <td style={td}>WAL FPI (Full Page Images)</td>
              <td style={{ ...td, textAlign: "right" }}>{walThroughput.wal_fpi?.toLocaleString() ?? "-"}</td>
            </tr>
            <tr>
              <td style={td}>WAL Bytes</td>
              <td style={{ ...td, textAlign: "right" }}>
                {walThroughput.wal_bytes !== null && walThroughput.wal_bytes !== undefined
                  ? formatNumber(walThroughput.wal_bytes)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>WAL Bytes/sec</td>
              <td style={{ ...td, textAlign: "right" }}>
                {walThroughput.wal_bytes_per_sec !== null && walThroughput.wal_bytes_per_sec !== undefined
                  ? `${formatNumber(walThroughput.wal_bytes_per_sec)}/s`
                  : "-"}
              </td>
            </tr>
            <tr>
              <td style={td}>Stats Reset</td>
              <td style={{ ...td, textAlign: "right" }}>{walThroughput.stats_reset ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

