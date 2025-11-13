// src/components/cards/Locks/LocksCard.tsx
// Locks Card component

import React from "react";
import type { LocksRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";

interface LocksCardProps {
  locks: LocksRow[];
}

export const LocksCard: React.FC<LocksCardProps> = ({ locks }) => {
  if (!locks.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Locks</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th style={th}>Mode</th>
            <th style={{ ...th, textAlign: "right", width: 120 }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {locks.map((r, i) => (
            <tr key={i}>
              <td style={td}>{r.mode}</td>
              <td style={{ ...td, textAlign: "right", width: 120 }}>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



