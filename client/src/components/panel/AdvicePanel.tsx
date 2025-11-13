// src/components/AdvicePanel.tsx
// Advice panel component - provides recommendations based on metrics

import React from "react";
import type * as types from "../../types";
import { cardStyle } from "../../utils/styles";

export type AdviceItem = {
  priority: "High" | "Medium" | "Info";
  message: string;
  action: string;
};

interface AdvicePanelProps {
  connectionUsage: types.ConnectionUsageRow | null;
  deadlocks: types.DeadlocksRow[];
  blockedSessions: types.BlockedSessionsRow[];
  indexUsage: types.IndexUsageRow[];
  seqVsIdxScans: types.SeqVsIdxScanRow[];
  tempIo: types.TempIoRow[];
  checkpointFreq: types.CheckpointFreqRow | null;
}

export const AdvicePanel: React.FC<AdvicePanelProps> = ({
  connectionUsage,
  deadlocks,
  blockedSessions,
  indexUsage,
  seqVsIdxScans,
  tempIo,
  checkpointFreq,
}) => {
  const advices: AdviceItem[] = [];

  // 1. Connection Usage > 80% - High
  if (
    connectionUsage &&
    connectionUsage.used_percent !== null &&
    connectionUsage.used_percent !== undefined &&
    Number(connectionUsage.used_percent) > 80
  ) {
    advices.push({
      priority: "High",
      message: `Connection usage đang ở ${Number(connectionUsage.used_percent).toFixed(2)}%`,
      action: "Xem xét tăng max_connections hoặc tối ưu connection pooling",
    });
  }

  // 2. Deadlocks > 0 - High
  const hasDeadlocks = deadlocks.some((r) => r.deadlocks > 0);
  if (hasDeadlocks) {
    const totalDeadlocks = deadlocks.reduce((sum, r) => sum + r.deadlocks, 0);
    advices.push({
      priority: "High",
      message: `Phát hiện ${totalDeadlocks} deadlock(s)`,
      action: "Kiểm tra và tối ưu các transaction có thể gây deadlock",
    });
  }

  // 3. Blocked Sessions > 0 - High
  if (blockedSessions.length > 0) {
    advices.push({
      priority: "High",
      message: `Có ${blockedSessions.length} phiên đang bị block`,
      action: "Kiểm tra các query blocking và xem xét kill các blocking queries",
    });
  }

  // 4. Temp IO cao - High/Medium
  const highTempIo = tempIo.filter((r) => {
    const bytesPerSec = r.bytes_per_sec;
    return bytesPerSec !== null && bytesPerSec !== undefined && Number(bytesPerSec) > 1000000;
  });
  if (highTempIo.length > 0) {
    advices.push({
      priority: "High",
      message: `Temp IO cao ở ${highTempIo.length} database(s)`,
      action: "Xem xét tăng work_mem để giảm temp file spills",
    });
  }

  // 5. Checkpoint quá dày - Medium
  if (
    checkpointFreq &&
    checkpointFreq.buffers_clean_per_sec !== null &&
    checkpointFreq.buffers_clean_per_sec !== undefined &&
    Number(checkpointFreq.buffers_clean_per_sec) > 100000
  ) {
    advices.push({
      priority: "Medium",
      message: "Checkpoint đang xảy ra quá thường xuyên",
      action: "Xem xét điều chỉnh checkpoint_timeout hoặc các thiết lập checkpoint",
    });
  }

  // 6. Index Usage < 50% - Medium
  const lowIdxUsage = indexUsage.filter(
    (r) => r.idx_usage !== null && r.idx_usage !== undefined && Number(r.idx_usage) < 50
  );
  if (lowIdxUsage.length > 0) {
    const tableNames = lowIdxUsage.slice(0, 3).map((r) => r.relname).join(", ");
    const moreText = lowIdxUsage.length > 3 ? ` và ${lowIdxUsage.length - 3} bảng khác` : "";
    advices.push({
      priority: "Medium",
      message: `${lowIdxUsage.length} bảng có index usage < 50% (${tableNames}${moreText})`,
      action: "Xem xét tạo index cho các bảng có seq_scan cao",
    });
  }

  // 7. SeqVsIdxScans - Low index usage - Medium
  const lowIdxUsageSeqVsIdx = seqVsIdxScans.filter(
    (r) =>
      r.idx_usage_percent !== null &&
      r.idx_usage_percent !== undefined &&
      Number(r.idx_usage_percent) < 50
  );
  if (lowIdxUsageSeqVsIdx.length > 0 && lowIdxUsage.length === 0) {
    // Only add if we haven't already added Index Usage advice
    const tableNames = lowIdxUsageSeqVsIdx.slice(0, 3).map((r) => r.relname).join(", ");
    const moreText = lowIdxUsageSeqVsIdx.length > 3 ? ` và ${lowIdxUsageSeqVsIdx.length - 3} bảng khác` : "";
    advices.push({
      priority: "Medium",
      message: `${lowIdxUsageSeqVsIdx.length} bảng có index usage < 50% (${tableNames}${moreText})`,
      action: "Xem xét tạo index cho các bảng có seq_scan cao",
    });
  }

  // Sort by priority: High -> Medium -> Info
  const sortedAdvices = advices.sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Info: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const highAdvices = sortedAdvices.filter((a) => a.priority === "High");
  const mediumAdvices = sortedAdvices.filter((a) => a.priority === "Medium");
  const infoAdvices = sortedAdvices.filter((a) => a.priority === "Info");

  return (
    <div style={{ ...cardStyle, gridColumn: "1 / span 2" }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: 18 }}>💡 Advice & Recommendations</h2>
      {sortedAdvices.length === 0 ? (
        <p style={{ color: "#4caf50", padding: "8px 0" }}>
          ✅ Không có vấn đề nào được phát hiện. Hệ thống đang hoạt động tốt!
        </p>
      ) : (
        <div>
          {/* High Priority */}
          {highAdvices.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "#d32f2f" }}>
                🔴 High Priority ({highAdvices.length})
              </h3>
              {highAdvices.map((advice, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: "#ffebee",
                    borderRadius: 8,
                    borderLeft: "4px solid #d32f2f",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{advice.message}</div>
                  <div style={{ color: "#666", fontSize: 14 }}>→ {advice.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Medium Priority */}
          {mediumAdvices.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "#f57c00" }}>
                🟡 Medium Priority ({mediumAdvices.length})
              </h3>
              {mediumAdvices.map((advice, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: "#fff3e0",
                    borderRadius: 8,
                    borderLeft: "4px solid #f57c00",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{advice.message}</div>
                  <div style={{ color: "#666", fontSize: 14 }}>→ {advice.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Info Priority */}
          {infoAdvices.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "#1976d2" }}>
                🔵 Info ({infoAdvices.length})
              </h3>
              {infoAdvices.map((advice, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: "#e3f2fd",
                    borderRadius: 8,
                    borderLeft: "4px solid #1976d2",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{advice.message}</div>
                  <div style={{ color: "#666", fontSize: 14 }}>→ {advice.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

