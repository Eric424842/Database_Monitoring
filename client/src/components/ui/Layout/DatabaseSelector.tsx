// src/components/ui/DatabaseSelector.tsx
// Component chọn database - màn hình đầu tiên

import React, { useState } from "react";
import type { DatabaseConnection } from "../../../types";
import { useDatabaseConnections } from "../../../hooks/useDatabaseConnections";
import { AddDatabaseForm } from "../../../components/ui/Modals/AddDatabaseForm";
import { SettingsModal } from "../../../components/ui/Modals/SettingsModal";
import { useThemeStyles } from "../../../utils/themeStyles";
import { useTranslation } from "../../../utils/i18n";

interface DatabaseSelectorProps {
  onSelectConnection: (connection: DatabaseConnection & { password?: string }) => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({ onSelectConnection }) => {
  const { connections, isLoaded, removeConnection } = useDatabaseConnections();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const theme = useThemeStyles();
  const { t } = useTranslation();

  // Test connection bằng cách gọi /api/health
  const testConnection = async (connection: DatabaseConnection & { password?: string }): Promise<boolean> => {
    try {
      // Gửi connection config trong headers
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          "X-DB-Host": connection.host,
          "X-DB-Port": String(connection.port),
          "X-DB-User": connection.user,
          "X-DB-Password": connection.password || "",
          "X-DB-Database": connection.database,
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      alert(`${t("cannot_connect")} ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  const handleConnect = async (connection: DatabaseConnection & { password?: string }) => {
    if (!connection.password) {
      alert(t("please_enter_password"));
      return;
    }

    setTestingConnection(connection.id);
    const success = await testConnection(connection);
    setTestingConnection(null);

    if (success) {
      onSelectConnection(connection);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("confirm_delete"))) {
      removeConnection(id);
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: theme.text.primary }}>{t("postgresql_dashboard")}</h1>
          <p style={{ color: theme.text.secondary, fontSize: 14 }}>{t("select_database")}</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: "8px 12px",
            border: `1px solid ${theme.border.default}`,
            borderRadius: 8,
            cursor: "pointer",
            background: theme.bg.secondary,
            color: theme.text.secondary,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
          }}
          title={t("settings")}
        >
          ⚙️
        </button>
      </div>

      {/* List of saved connections */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.text.primary }}>{t("database_list")}</h2>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              border: "1px solid #4caf50",
              borderRadius: 8,
              cursor: "pointer",
              background: theme.isDark ? "#1b5e20" : "#e8f5e9",
              color: theme.isDark ? "#81c784" : "#2e7d32",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span> {t("add_database")}
          </button>
        </div>

        {connections.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              border: `2px dashed ${theme.border.default}`,
              borderRadius: 12,
              backgroundColor: theme.bg.secondary,
            }}
          >
            <p style={{ color: theme.text.secondary, marginBottom: 8 }}>{t("no_databases")}</p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: "8px 16px",
                border: "1px solid #4caf50",
                borderRadius: 8,
                cursor: "pointer",
                background: "#4caf50",
                color: "#fff",
                fontWeight: 500,
              }}
            >
              {t("add_first_database")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {connections.map((conn) => (
              <div
                key={conn.id}
                style={{
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: theme.bg.card,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: theme.isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4caf50";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(76, 175, 80, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border.default;
                  e.currentTarget.style.boxShadow = theme.isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: theme.text.primary }}>{conn.label}</h3>
                      {conn.lastUsed && (
                        <span style={{ fontSize: 12, color: theme.text.muted }}>
                          ({t("last_used")} {new Date(conn.lastUsed).toLocaleDateString(t("language") === "vi" ? "vi-VN" : "en-US")})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: theme.text.secondary, marginBottom: 12 }}>
                      <div>📍 {conn.host}:{conn.port}</div>
                      <div>👤 {conn.user}</div>
                      <div>💾 {conn.database}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Prompt for password
                        const password = prompt(t("enter_password"));
                        if (password) {
                          handleConnect({ ...conn, password });
                        }
                      }}
                      disabled={testingConnection === conn.id}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #1976d2",
                        borderRadius: 6,
                        cursor: testingConnection === conn.id ? "wait" : "pointer",
                        background: testingConnection === conn.id ? "#ccc" : "#e3f2fd",
                        color: testingConnection === conn.id ? "#666" : "#1976d2",
                        fontWeight: 500,
                        fontSize: 13,
                        marginRight: 8,
                      }}
                    >
                      {testingConnection === conn.id ? t("connecting") : t("connect")}
                    </button>
                    <button
                      onClick={(e) => handleDelete(conn.id, e)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d32f2f",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "#ffebee",
                        color: "#d32f2f",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Database Form Modal */}
      {showAddForm && (
        <AddDatabaseForm
          onClose={() => setShowAddForm(false)}
          onSave={(connection) => {
            setShowAddForm(false);
            // Tự động test và connect sau khi lưu
            handleConnect(connection);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default DatabaseSelector;

