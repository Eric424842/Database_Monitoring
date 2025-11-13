import React from "react";
import { DatabaseConnectionProvider, useDatabaseConnectionContext } from "./contexts/DatabaseConnectionContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { DatabaseSelector } from "./components/ui/Layout/DatabaseSelector";
import Dashboard from "./Dashboard";
import { useTranslation } from "./utils/i18n";
import { useThemeStyles } from "./utils/themeStyles";

function AppContent() {
  const { connection, setConnection, disconnect } = useDatabaseConnectionContext();
  const { t } = useTranslation();
  const theme = useThemeStyles();

  if (!connection) {
    return (
      <DatabaseSelector
        onSelectConnection={(conn) => {
          setConnection(conn);
        }}
      />
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px 16px",
          backgroundColor: theme.isDark ? "#1b5e20" : "#e8f5e9",
          borderBottom: `1px solid ${theme.isDark ? "#4caf50" : "#4caf50"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 14, color: theme.isDark ? "#81c784" : "#2e7d32" }}>
          📊 {t("currently_connected")} <strong>{connection.label}</strong> ({connection.host}:{connection.port}/{connection.database})
        </div>
        <button
          onClick={disconnect}
          style={{
            padding: "6px 12px",
            border: "1px solid #d32f2f",
            borderRadius: 6,
            cursor: "pointer",
            background: theme.isDark ? "#7f1d1d" : "#ffebee",
            color: theme.isDark ? "#fca5a5" : "#d32f2f",
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          {t("change_database")}
        </button>
      </div>
      <div style={{ flex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
        <Dashboard />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <DatabaseConnectionProvider>
        <AppContent />
      </DatabaseConnectionProvider>
    </SettingsProvider>
  );
}
