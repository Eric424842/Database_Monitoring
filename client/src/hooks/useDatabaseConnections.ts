// src/hooks/useDatabaseConnections.ts
// Hook quản lý danh sách database connections (localStorage)

import { useState, useEffect, useCallback } from "react";
import type { DatabaseConnection } from "../types";

const CONNECTIONS_STORAGE_KEY = "pg_dashboard_connections";
const SCHEMA_VERSION = "1.0.0";

export interface StoredConnections {
  schemaVersion: string;
  connections: DatabaseConnection[];
}

const DEFAULT_CONNECTIONS: StoredConnections = {
  schemaVersion: SCHEMA_VERSION,
  connections: [],
};

export function useDatabaseConnections() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load connections từ localStorage khi mount và tự động load default từ .env
  useEffect(() => {
    const loadConnections = async () => {
      try {
        // 1. Load từ localStorage
        const stored = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
        let loadedConnections: DatabaseConnection[] = [];

        if (stored) {
          const parsed: StoredConnections = JSON.parse(stored);
          
          // Kiểm tra schemaVersion
          if (parsed.schemaVersion !== SCHEMA_VERSION) {
            console.warn(
              `Connections schemaVersion mismatch: expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}. Resetting.`
            );
            localStorage.removeItem(CONNECTIONS_STORAGE_KEY);
            loadedConnections = [];
          } else {
            // Loại bỏ password từ stored connections (không lưu password)
            loadedConnections = parsed.connections.map(({ password, ...rest }) => rest);
          }
        }

        // 2. Load tất cả databases từ PostgreSQL và tự động tạo connections
        try {
          const databasesRes = await fetch("/api/databases");
          if (databasesRes.ok) {
            const databasesData = await databasesRes.json();
            if (databasesData.databases && Array.isArray(databasesData.databases)) {
              let hasNewConnections = false;
              
              // Tạo connection cho mỗi database
              for (const dbInfo of databasesData.databases) {
                // Kiểm tra xem đã có connection với cùng host:port:database chưa
                const exists = loadedConnections.some(
                  (c) => 
                    c.host === dbInfo.host &&
                    c.port === dbInfo.port &&
                    c.database === dbInfo.name &&
                    c.user === dbInfo.user
                );

                // Nếu chưa có, tự động thêm vào
                if (!exists) {
                  const newConnection: DatabaseConnection = {
                    id: `auto_${dbInfo.name}_${Date.now()}`,
                    label: dbInfo.label || `${dbInfo.name} (${dbInfo.host}:${dbInfo.port})`,
                    host: dbInfo.host,
                    port: dbInfo.port,
                    user: dbInfo.user,
                    database: dbInfo.name,
                    createdAt: new Date().toISOString(),
                  };
                  loadedConnections = [...loadedConnections, newConnection];
                  hasNewConnections = true;
                }
              }
              
              // Nếu có connections mới, lưu vào localStorage
              if (hasNewConnections) {
                const stored: StoredConnections = {
                  schemaVersion: SCHEMA_VERSION,
                  connections: loadedConnections,
                };
                localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(stored));
              }
            }
          }
        } catch (error) {
          console.warn("Could not load databases from PostgreSQL:", error);
          // Không fail nếu không load được databases, chỉ warning
        }

        setConnections(loadedConnections);
      } catch (error) {
        console.error("Error loading connections:", error);
        localStorage.removeItem(CONNECTIONS_STORAGE_KEY);
        setConnections([]);
      } finally {
        setIsLoaded(true);
      }
    };

    loadConnections();
  }, []);

  // Lưu connections vào localStorage (không lưu password)
  const saveConnections = useCallback((newConnections: DatabaseConnection[]) => {
    try {
      const sanitized = newConnections.map(({ password, ...rest }) => rest);
      const stored: StoredConnections = {
        schemaVersion: SCHEMA_VERSION,
        connections: sanitized,
      };
      setConnections(sanitized);
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Error saving connections:", error);
    }
  }, []);

  // Thêm connection mới
  const addConnection = useCallback((connection: Omit<DatabaseConnection, "id" | "createdAt" | "lastUsed">) => {
    const newConnection: DatabaseConnection = {
      ...connection,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    saveConnections([...connections, newConnection]);
    return newConnection;
  }, [connections, saveConnections]);

  // Xóa connection
  const removeConnection = useCallback((id: string) => {
    saveConnections(connections.filter((c) => c.id !== id));
  }, [connections, saveConnections]);

  // Cập nhật connection
  const updateConnection = useCallback((id: string, updates: Partial<DatabaseConnection>) => {
    const updated = connections.map((c) =>
      c.id === id ? { ...c, ...updates, id: c.id } : c
    );
    saveConnections(updated);
  }, [connections, saveConnections]);

  // Đánh dấu connection được sử dụng
  const markAsUsed = useCallback((id: string) => {
    updateConnection(id, { lastUsed: new Date().toISOString() });
  }, [updateConnection]);

  return {
    connections,
    isLoaded,
    addConnection,
    removeConnection,
    updateConnection,
    markAsUsed,
  };
}

