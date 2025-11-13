// src/utils/styles.ts
// Style constants cho Dashboard - DEPRECATED: Sử dụng useThemeStyles() thay thế

import type { CSSProperties } from "react";

// Legacy styles - vẫn giữ để tương thích, nhưng nên migrate sang useThemeStyles()
export const th: CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "12px 0",
  fontWeight: 600,
};

export const td: CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px dashed #f0f0f0",
  verticalAlign: "top",
};

export const cardStyle: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
};

export const sectionStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "1fr 10fr",
  gap: 16,
};

