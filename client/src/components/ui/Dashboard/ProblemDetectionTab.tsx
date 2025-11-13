
// src/components/ui/Dashboard/ProblemDetectionTab.tsx
// Tab "Phát Hiện Vấn Đề" - UI hiển thị các vấn đề từ Problem Analyzer (backend)

import React, { useState, useEffect } from "react";
import type { Problem, DatabaseConnection, ProblemPath } from "../../../types";
import { useThemeStyles } from "../../../utils/themeStyles";

interface ProblemDetectionTabProps {
  minSec?: number;
  connection?: DatabaseConnection & { password?: string };
  refreshTrigger?: number; // Trigger refresh khi giá trị này thay đổi
}

type PathFilter = "all" | "read" | "write";

export const ProblemDetectionTab: React.FC<ProblemDetectionTabProps> = ({ minSec = 60, connection, refreshTrigger }) => {
  const theme = useThemeStyles();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pathFilter, setPathFilter] = useState<PathFilter>("all");

  // Fetch problems từ backend API
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (connection) {
          headers["X-DB-Host"] = connection.host;
          headers["X-DB-Port"] = String(connection.port);
          headers["X-DB-User"] = connection.user;
          headers["X-DB-Password"] = connection.password || "";
          headers["X-DB-Database"] = connection.database;
        }

        const res = await fetch(`/api/problems?minSec=${minSec}`, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setProblems(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch problems");
        console.error("Failed to fetch problems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [minSec, connection, refreshTrigger]); // Thêm refreshTrigger vào dependencies

  // Filter problems by path
  const filteredProblems = React.useMemo(() => {
    if (pathFilter === "all") {
      return problems;
    }
    return problems.filter((p) => p.path === pathFilter);
  }, [problems, pathFilter]);

  // Group problems by priority
  const problemsByPriority = React.useMemo(() => {
    return {
      High: filteredProblems.filter((p) => p.priority === "High"),
      Medium: filteredProblems.filter((p) => p.priority === "Medium"),
      Low: filteredProblems.filter((p) => p.priority === "Low"),
    };
  }, [filteredProblems]);

  const totalProblems = filteredProblems.length;

  const getSeverityColor = (priority: Problem["priority"]): {
    bg: string;
    border: string;
    text: string;
    icon: string;
    badge: string;
  } => {
    switch (priority) {
      case "High":
        return {
          bg: theme.isDark ? "#7f1d1d" : "#ffebee",
          border: "#d32f2f",
          text: theme.isDark ? "#fca5a5" : "#c62828",
          icon: "🔴",
          badge: "Nghiêm trọng",
        };
      case "Medium":
        return {
          bg: theme.isDark ? "#78350f" : "#fff3e0",
          border: "#f57c00",
          text: theme.isDark ? "#fbbf24" : "#e65100",
          icon: "🟡",
          badge: "Cảnh báo",
        };
      case "Low":
        return {
          bg: theme.isDark ? "#1e3a5f" : "#e3f2fd",
          border: "#1976d2",
          text: theme.isDark ? "#93c5fd" : "#1565c0",
          icon: "🔵",
          badge: "Cảnh báo",
        };
    }
  };

  const getCategoryIcon = (category: Problem["category"]): string => {
    const icons: Record<Problem["category"], string> = {
      Connection: "🔌",
      Performance: "⚡",
      Locking: "🔒",
      Cache: "💾",
      Maintenance: "🧹",
      "I/O": "📁",
      Transaction: "💳",
      Query: "🔍",
    };
    return icons[category] || "📊";
  };

  const renderProblem = (problem: Problem) => {
    const colors = getSeverityColor(problem.priority);
    
    return (
      <div
        key={problem.id}
        style={{
          marginBottom: 16,
          padding: 20,
          backgroundColor: colors.bg,
          borderRadius: 12,
          borderLeft: `5px solid ${colors.border}`,
          border: `1px solid ${theme.border.default}`,
          boxShadow: `0 2px 4px ${theme.isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 4px 8px ${theme.isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 2px 4px ${theme.isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"}`;
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: 28 }}>{getCategoryIcon(problem.category)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: colors.text,
                }}>
                  {colors.icon} {problem.title}
                </h3>
                <span style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  backgroundColor: colors.border,
                  color: "white",
                  borderRadius: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}>
                  {colors.badge}
                </span>
                <span style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  backgroundColor: theme.bg.secondary,
                  color: theme.text.secondary,
                  borderRadius: 6,
                }}>
                  {problem.category}
                </span>
              </div>
              <p style={{ 
                margin: 0, 
                fontSize: 14, 
                color: theme.text.primary, 
                lineHeight: 1.6,
              }}>
                {problem.message}
              </p>
            </div>
          </div>
        </div>

        {/* Lý do & Chi tiết */}
        <div style={{ 
          marginTop: 12, 
          padding: 12, 
          backgroundColor: theme.bg.secondary, 
          borderRadius: 8,
          border: `1px solid ${theme.border.default}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text.secondary, marginBottom: 4 }}>
                Gợi ý xử lý:
              </div>
              <div style={{ fontSize: 14, color: theme.text.primary, lineHeight: 1.6 }}>
                {problem.action}
              </div>
            </div>
          </div>

          {/* Metadata nếu có */}
          {problem.metadata && Object.keys(problem.metadata).length > 0 && (
            <div style={{ 
              marginTop: 8, 
              paddingTop: 8, 
              borderTop: `1px solid ${theme.border.light}`,
            }}>
              <details style={{ cursor: "pointer" }}>
                <summary style={{ 
                  fontSize: 12, 
                  color: theme.text.secondary, 
                  fontWeight: 500,
                  userSelect: "none",
                }}>
                  📋 Xem chi tiết
                </summary>
                <div style={{ 
                  marginTop: 8, 
                  padding: 8, 
                  backgroundColor: theme.bg.card, 
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: theme.text.secondary,
                  maxHeight: 200,
                  overflow: "auto",
                }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(problem.metadata, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Current Value & Threshold */}
          {(problem.currentValue !== undefined || problem.threshold !== undefined) && (
            <div style={{ 
              marginTop: 8, 
              paddingTop: 8, 
              borderTop: `1px solid ${theme.border.light}`,
              display: "flex",
              gap: 16,
              fontSize: 12,
              color: theme.text.secondary,
            }}>
              {problem.currentValue !== undefined && (
                <span>
                  <strong>Giá trị hiện tại:</strong>{" "}
                  <span style={{ color: colors.text, fontWeight: 600 }}>
                    {typeof problem.currentValue === "number" 
                      ? problem.currentValue.toLocaleString() 
                      : problem.currentValue}
                  </span>
                </span>
              )}
              {problem.threshold !== undefined && (
                <span>
                  <strong>Ngưỡng:</strong>{" "}
                  <span style={{ color: theme.text.primary, fontWeight: 600 }}>
                    {typeof problem.threshold === "number" 
                      ? problem.threshold.toLocaleString() 
                      : problem.threshold}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: theme.text.secondary }}>Đang phân tích vấn đề...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "48px", 
        textAlign: "center",
        backgroundColor: theme.isDark ? "#7f1d1d" : "#ffebee",
        borderRadius: 12,
        border: `1px solid #d32f2f`,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#d32f2f", fontWeight: 600 }}>
          Lỗi khi tải dữ liệu
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.text.secondary }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Header với thống kê */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: 24,
        padding: 16,
        backgroundColor: theme.bg.secondary,
        borderRadius: 12,
        border: `1px solid ${theme.border.default}`,
      }}>
        <div>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            fontSize: 24, 
            fontWeight: 600, 
            color: theme.text.primary,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            🔍 Phát Hiện Vấn Đề
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: theme.text.secondary }}>
            Tự động phân tích {totalProblems > 0 ? `${totalProblems} vấn đề` : "không có vấn đề"} được phát hiện từ 24 metrics
          </p>
        </div>
        {totalProblems > 0 && (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#d32f2f" }}>
                {problemsByPriority.High.length}
              </div>
              <div style={{ fontSize: 12, color: theme.text.secondary }}>🔴 Nghiêm trọng</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f57c00" }}>
                {problemsByPriority.Medium.length}
              </div>
              <div style={{ fontSize: 12, color: theme.text.secondary }}>🟡 Cảnh báo</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1976d2" }}>
                {problemsByPriority.Low.length}
              </div>
              <div style={{ fontSize: 12, color: theme.text.secondary }}>🔵 Cảnh báo</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: All / Read-Path / Write-Path */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: `2px solid ${theme.border.default}`,
      }}>
        {([
          { id: "all" as PathFilter, label: "All", icon: "📊" },
          { id: "read" as PathFilter, label: "Read-Path", icon: "📖" },
          { id: "write" as PathFilter, label: "Write-Path", icon: "✍️" },
        ] as const).map((tab) => {
          const isActive = pathFilter === tab.id;
          const count = tab.id === "all" 
            ? problems.length 
            : problems.filter((p) => p.path === tab.id).length;
          
          return (
            <button
              key={tab.id}
              onClick={() => setPathFilter(tab.id)}
              type="button"
              style={{
                padding: "12px 24px",
                border: "none",
                borderBottom: isActive ? `3px solid ${theme.isDark ? "#60a5fa" : "#1976d2"}` : "3px solid transparent",
                backgroundColor: "transparent",
                color: isActive 
                  ? (theme.isDark ? "#60a5fa" : "#1976d2")
                  : theme.text.secondary,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: -2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = theme.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = theme.text.secondary;
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  backgroundColor: isActive 
                    ? (theme.isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(25, 118, 210, 0.1)")
                    : theme.bg.secondary,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Danh sách vấn đề */}
      {totalProblems === 0 ? (
        <div style={{ 
          padding: 48, 
          textAlign: "center",
          backgroundColor: theme.isDark ? "#1e3a1e" : "#e8f5e9",
          borderRadius: 12,
          border: `2px solid ${theme.isDark ? "#2e7d32" : "#4caf50"}`,
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ 
            margin: "0 0 8px 0", 
            fontSize: 20, 
            color: theme.isDark ? "#81c784" : "#2e7d32", 
            fontWeight: 600,
          }}>
            Không có vấn đề nào được phát hiện
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: theme.text.secondary }}>
            Hệ thống đang hoạt động tốt! Tất cả 24 metrics đều trong ngưỡng an toàn.
          </p>
        </div>
      ) : (
        <div>
          {/* High Priority */}
          {problemsByPriority.High.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: 20, 
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
              }}>
                🔴 Vấn Đề Nghiêm Trọng ({problemsByPriority.High.length})
              </h3>
              {problemsByPriority.High.map(renderProblem)}
            </div>
          )}

          {/* Medium Priority */}
          {problemsByPriority.Medium.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: 20, 
                color: "#f57c00",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
              }}>
                🟡 Cảnh Báo ({problemsByPriority.Medium.length})
              </h3>
              {problemsByPriority.Medium.map(renderProblem)}
            </div>
          )}

          {/* Low Priority */}
          {problemsByPriority.Low.length > 0 && (
            <div>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: 20, 
                color: "#1976d2",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
              }}>
                🔵 Cảnh Báo ({problemsByPriority.Low.length})
              </h3>
              {problemsByPriority.Low.map(renderProblem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

