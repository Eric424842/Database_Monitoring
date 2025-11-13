// src/components/ui/AddDatabaseForm.tsx
// Form thêm database connection mới

import React, { useState } from "react";
import type { DatabaseConnection } from "../../../types";
import { useDatabaseConnections } from "../../../hooks/useDatabaseConnections";

interface AddDatabaseFormProps {
  onClose: () => void;
  onSave: (connection: DatabaseConnection & { password: string }) => void;
}

export const AddDatabaseForm: React.FC<AddDatabaseFormProps> = ({ onClose, onSave }) => {
  const { addConnection } = useDatabaseConnections();
  const [formData, setFormData] = useState({
    label: "",
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "",
    database: "postgres",
  });
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Tự động tạo "Tên hiển thị" từ Database name nếu chưa điền hoặc đang giống với database name cũ
      if (field === "database" && (!prev.label || prev.label === `${prev.database} (${prev.host}:${prev.port})`)) {
        updated.label = `${value} (${updated.host}:${updated.port})`;
      }
      
      // Nếu user thay đổi host hoặc port, cập nhật label nếu đang dùng format tự động
      if ((field === "host" || field === "port") && (!prev.label || prev.label.startsWith(`${prev.database} (`))) {
        updated.label = `${updated.database} (${updated.host}:${updated.port})`;
      }
      
      return updated;
    });
    setError(null);
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      // Gửi connection config trong headers
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          "X-DB-Host": formData.host,
          "X-DB-Port": String(formData.port),
          "X-DB-User": formData.user,
          "X-DB-Password": formData.password,
          "X-DB-Database": formData.database,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation - Tự động tạo label nếu chưa có
    const finalLabel = formData.label.trim() || `${formData.database} (${formData.host}:${formData.port})`;
    if (!formData.host.trim()) {
      setError("Vui lòng nhập host");
      return;
    }
    if (!formData.user.trim()) {
      setError("Vui lòng nhập user");
      return;
    }
    if (!formData.database.trim()) {
      setError("Vui lòng nhập database name");
      return;
    }
    if (!formData.password) {
      setError("Vui lòng nhập password");
      return;
    }

    setTesting(true);
    try {
      // Test connection trước
      const testSuccess = await testConnection();
      if (!testSuccess) {
        setError("Không thể kết nối đến database. Vui lòng kiểm tra lại thông tin.");
        return;
      }

      // Lưu connection (không lưu password)
      const newConnection = addConnection({
        label: finalLabel,
        host: formData.host.trim(),
        port: formData.port,
        user: formData.user.trim(),
        database: formData.database.trim(),
      });

      // Gọi onSave với password (để connect ngay)
      onSave({
        ...newConnection,
        password: formData.password,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể kết nối đến database");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Thêm Database Connection</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 24,
              cursor: "pointer",
              color: "#666",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              backgroundColor: "#ffebee",
              border: "1px solid #d32f2f",
              borderRadius: 6,
              color: "#c62828",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Tên hiển thị <span style={{ color: "#d32f2f" }}>*</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#666", marginLeft: 8 }}>
                  (Tên hiển thị trong danh sách, khác với Database name)
                </span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleChange("label", e.target.value)}
                placeholder="Sẽ tự động điền khi bạn nhập Database name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Host <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  placeholder="localhost"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                  Port <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleChange("port", parseInt(e.target.value) || 5432)}
                  placeholder="5432"
                  min={1}
                  max={65535}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                User <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.user}
                onChange={(e) => handleChange("user", e.target.value)}
                placeholder="postgres"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  fontSize: 14,
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Password <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  fontSize: 14,
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Database Name <span style={{ color: "#d32f2f" }}>*</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#666", marginLeft: 8 }}>
                  (Tên database thực tế trong PostgreSQL)
                </span>
              </label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => handleChange("database", e.target.value)}
                placeholder="postgres"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  fontSize: 14,
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={testing}
              style={{
                padding: "10px 20px",
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: testing ? "not-allowed" : "pointer",
                background: "#f7f7f7",
                color: "#666",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={testing}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: 6,
                cursor: testing ? "wait" : "pointer",
                background: testing ? "#ccc" : "#4caf50",
                color: "#fff",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              {testing ? "Đang kết nối..." : "Connect & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

