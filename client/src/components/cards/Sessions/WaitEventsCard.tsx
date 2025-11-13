// src/components/cards/Sessions/WaitEventsCard.tsx
// Wait Events Card component

import React from "react";
import type { WaitEventRow } from "../../../types";
import { th, td, cardStyle } from "../../../utils/styles";
import { formatDuration } from "../../../utils/formatters";

interface WaitEventsCardProps {
  waitEvents: WaitEventRow[];
}

export const WaitEventsCard: React.FC<WaitEventsCardProps> = ({ waitEvents }) => {
  if (!waitEvents.length) return null;

  return (
    <div style={cardStyle}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Wait Events (top 20)</h2>
      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>PID</th>
              <th style={th}>User</th>
              <th style={th}>DB</th>
              <th style={th}>State</th>
              <th style={th}>Wait Event Type</th>
              <th style={th}>Wait Event</th>
              <th style={th}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {waitEvents.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.pid}</td>
                <td style={td}>{r.usename ?? "-"}</td>
                <td style={td}>{r.datname ?? "-"}</td>
                <td style={td}>{r.state ?? "-"}</td>
                <td style={td}>{r.wait_event_type ?? "-"}</td>
                <td style={td}>{r.wait_event ?? "-"}</td>
                <td style={td}>{formatDuration(r.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

