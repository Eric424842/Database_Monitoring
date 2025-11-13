// src/components/ui/ErrorDisplay.tsx
// Error display component

import React from "react";

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div style={{ marginBottom: 12, padding: 12, border: "1px solid #f3b3b3", background: "#fff3f3", borderRadius: 8 }}>
      <strong style={{ color: "#b00020" }}>Lỗi:</strong> {error}
      <div style={{ marginTop: 6, fontSize: 13, color: "#7a3d3d" }}>
        Gợi ý kiểm tra:
        <ul style={{ margin: "6px 0 0 18px" }}>
          <li>Backend có route <code>/api/overview</code> và <code>/api/long-running</code> chưa?</li>
          <li>Vite proxy đã cấu hình trong <code>vite.config.ts</code> (proxy /api → 8080) chưa?</li>
          <li>Nếu vẫn dùng URL tuyệt đối, hãy đổi sang URL tương đối <code>/api/...</code>.</li>
        </ul>
      </div>
    </div>
  );
};

