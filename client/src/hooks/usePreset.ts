// src/hooks/usePreset.ts
// Preset hook để lưu/khôi phục cấu hình người dùng với schemaVersion

import { useState, useEffect, useCallback } from "react";

const PRESET_STORAGE_KEY = "pg_dashboard_preset";
const SCHEMA_VERSION = "1.0.0"; // Tăng version khi đổi cấu trúc preset

export interface DashboardPreset {
  schemaVersion: string;
  minSec: number;
  autoRefresh: {
    enabled: boolean;
    interval: 10 | 30 | 60;
  };
  // Có thể mở rộng thêm:
  // alertThresholds?: {
  //   connectionUsage?: number;
  //   tempIoBytesPerSec?: number;
  //   checkpointBuffersPerSec?: number;
  // };
  // tableLayout?: {
  //   hiddenColumns?: string[];
  // };
}

const DEFAULT_PRESET: DashboardPreset = {
  schemaVersion: SCHEMA_VERSION,
  minSec: 60,
  autoRefresh: {
    enabled: false,
    interval: 30,
  },
};

export function usePreset() {
  const [preset, setPreset] = useState<DashboardPreset>(DEFAULT_PRESET);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preset từ localStorage khi mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESET_STORAGE_KEY);
      if (stored) {
        const parsed: DashboardPreset = JSON.parse(stored);
        
        // Kiểm tra schemaVersion - nếu khác thì reset về mặc định
        if (parsed.schemaVersion !== SCHEMA_VERSION) {
          console.warn(
            `Preset schemaVersion mismatch: expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}. Resetting to default.`
          );
          localStorage.removeItem(PRESET_STORAGE_KEY);
          setPreset(DEFAULT_PRESET);
        } else {
          // Merge với default để đảm bảo có đầy đủ fields
          setPreset({
            ...DEFAULT_PRESET,
            ...parsed,
            autoRefresh: {
              ...DEFAULT_PRESET.autoRefresh,
              ...parsed.autoRefresh,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error loading preset:", error);
      // Nếu parse lỗi, xóa preset cũ và dùng default
      localStorage.removeItem(PRESET_STORAGE_KEY);
      setPreset(DEFAULT_PRESET);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Lưu preset vào localStorage
  const savePreset = useCallback((newPreset: Partial<DashboardPreset>) => {
    try {
      const updated: DashboardPreset = {
        ...preset,
        ...newPreset,
        schemaVersion: SCHEMA_VERSION,
        autoRefresh: {
          ...preset.autoRefresh,
          ...newPreset.autoRefresh,
        },
      };
      setPreset(updated);
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving preset:", error);
    }
  }, [preset]);

  // Update minSec
  const updateMinSec = useCallback((minSec: number) => {
    savePreset({ minSec });
  }, [savePreset]);

  // Update auto-refresh
  const updateAutoRefresh = useCallback((enabled: boolean, interval?: 10 | 30 | 60) => {
    savePreset({
      autoRefresh: {
        enabled,
        interval: interval ?? preset.autoRefresh.interval,
      },
    });
  }, [savePreset, preset.autoRefresh.interval]);

  // Reset về mặc định
  const resetPreset = useCallback(() => {
    localStorage.removeItem(PRESET_STORAGE_KEY);
    setPreset(DEFAULT_PRESET);
  }, []);

  return {
    preset,
    isLoaded,
    updateMinSec,
    updateAutoRefresh,
    resetPreset,
  };
}

