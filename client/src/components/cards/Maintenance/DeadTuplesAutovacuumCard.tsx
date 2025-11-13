// src/components/cards/Maintenance/DeadTuplesAutovacuumCard.tsx
// Dead Tuples & Autovacuum Count Card component

import React from "react";
import type * as types from "../../../types";
import { th, td, cardStyle, sectionStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";
import { formatPercent } from "../../../utils/formatters";

interface TempIOAndCheckpointSectionProps {
  deadTuplesAutovacuum: types.DeadTuplesAutovacuumRow[];
}

export const TempIOAndCheckpointSection: React.FC<TempIOAndCheckpointSectionProps> = ({
  deadTuplesAutovacuum,
}) => {
  return (
    <section style={{ ...sectionStyle, marginTop: 16 }}>
      {/* Dead Tuples & Autovacuum Count */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
          <span>
            Dead Tuples & Autovacuum Count
            {deadTuplesAutovacuum.some(r => {
              const deadPct = r.dead_percent;
              return deadPct !== null && deadPct !== undefined && Number(deadPct) > 50;
            }) && (
              <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠ High</span>
            )}
          </span>
          <MetricTooltip
            title="Dead Tuples & Autovacuum Count"
            description="Top 20 bảng có nhiều dead tuples nhất, kèm thông tin về autovacuum và vacuum count. Sắp xếp theo dead % giảm dần."
            goodValue="Dead % < 20% - Dọn dẹp tốt"
            warningValue="Dead % > 50% - Cần kiểm tra autovacuum"
            additionalInfo="Dead tuples nhiều làm bảng phình to và chậm query. Autovacuum count cho biết bảng được dọn dẹp thường xuyên như thế nào."
          />
        </h2>
        {!deadTuplesAutovacuum.length ? (
          <p style={{ color: "#666" }}>Không có dữ liệu.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={th}>Schema</th>
                  <th style={th}>Table</th>
                  <th style={{ ...th, textAlign: "center" }}>Dead %</th>
                  <th style={{ ...th, textAlign: "center" }}>AutoVac Count</th>
                  <th style={{ ...th, textAlign: "center" }}>Vacuum Count</th>
                </tr>
              </thead>
              <tbody>
                {deadTuplesAutovacuum.map((r, i) => {
                  const deadPct = r.dead_percent;
                  const isHigh = deadPct !== null && deadPct !== undefined && Number(deadPct) > 50;
                  return (
                    <tr key={i}>
                      <td style={td}>{r.schema}</td>
                      <td style={td}>{r.table}</td>
                      <td style={{ ...td, textAlign: "center", color: isHigh ? "#d32f2f" : undefined }}>
                        {deadPct !== null && deadPct !== undefined ? formatPercent(deadPct) : "-"}
                        {isHigh && (
                          <span style={{ color: "#d32f2f", marginLeft: 8 }}>⚠</span>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: "center" }}>{r.autovacuum_count?.toLocaleString() ?? "-"}</td>
                      <td style={{ ...td, textAlign: "center" }}>{r.vacuum_count?.toLocaleString() ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

