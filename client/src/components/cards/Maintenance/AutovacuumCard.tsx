// src/components/cards/Maintenance/AutovacuumCard.tsx
// Autovacuum & Dead Tuples Card component

import React from "react";
import type { AutoVacRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { MetricTooltip } from "../../ui/Shared/MetricTooltip";

interface AutovacuumCardProps {
  autoVac: AutoVacRow[];
}

export const AutovacuumCard: React.FC<AutovacuumCardProps> = ({ autoVac }) => {
  if (!autoVac.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}>
        <span>Autovacuum & Dead Tuples</span>
        <MetricTooltip
          title="Autovacuum & Dead Tuples"
          description="Dead tuples là các bản ghi đã bị UPDATE hoặc DELETE nhưng chưa được xóa khỏi disk. Autovacuum tự động dọn dẹp dead tuples."
          goodValue="Dead tuples < 20% - Dọn dẹp tốt"
          warningValue="Dead tuples > 50% - Cần kiểm tra autovacuum"
          additionalInfo="Dead tuples nhiều làm bảng phình to và chậm query. Nên đảm bảo autovacuum chạy đều và đúng lịch."
        />
      </h2>
      {!autoVac.length ? (
        <p style={{ color: "#666" }}>Không có dữ liệu.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ ...th, textAlign: "left" }}>Table</th>
                <th style={{ ...th, textAlign: "center" }}>Live Tuples</th>
                <th style={{ ...th, textAlign: "center" }}>Dead Tuples</th>
                <th style={{ ...th, textAlign: "center" }}>Last AutoVacuum</th>
                <th style={{ ...th, textAlign: "center" }}>Last Vacuum</th>
              </tr>
            </thead>
            <tbody>
              {autoVac.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, textAlign: "left" }}>{r.relname}</td>
                  <td style={{ ...td, textAlign: "center" }}>{r.n_live_tup ?? "-"}</td>
                  <td style={{ ...td, textAlign: "center" }}>{r.n_dead_tup ?? "-"}</td>
                  <td style={{ ...td, textAlign: "center" }}>{r.last_autovacuum ?? "-"}</td>
                  <td style={{ ...td, textAlign: "center" }}>{r.last_vacuum ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};



