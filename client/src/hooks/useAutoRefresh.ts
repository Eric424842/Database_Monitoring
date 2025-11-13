// src/hooks/useAutoRefresh.ts
// Auto-refresh hook với anti-throttle và xử lý tab background

import { useState, useEffect, useRef, useCallback } from "react";

export type RefreshInterval = 10 | 30 | 60;

interface UseAutoRefreshOptions {
  enabled: boolean;
  interval: RefreshInterval;
  onRefresh: () => void | Promise<void>;
  loading: boolean;
}

export function useAutoRefresh({ enabled, interval, onRefresh, loading }: UseAutoRefreshOptions) {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Theo dõi visibility của tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    setIsTabVisible(!document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Hàm refresh với anti-throttle
  const triggerRefresh = useCallback(async () => {
    // Nếu đang loading hoặc đang refresh, bỏ qua lần này
    if (isRefreshingRef.current || loading) {
      return;
    }

    // Nếu tab đang ở background, giảm tần suất (tạm dừng)
    if (!isTabVisible) {
      return;
    }

    isRefreshingRef.current = true;
    try {
      await onRefresh();
    } catch (error) {
      console.error("Auto-refresh error:", error);
    } finally {
      // Đợi một chút để đảm bảo loading state đã cập nhật
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 100);
    }
  }, [onRefresh, loading, isTabVisible]);

  // Thiết lập interval
  useEffect(() => {
    // Xóa interval cũ nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Chỉ tạo interval nếu enabled
    if (enabled) {
      // Tính interval theo giây (chuyển sang milliseconds)
      const intervalMs = interval * 1000;

      // Tạo interval mới
      intervalRef.current = setInterval(() => {
        triggerRefresh();
      }, intervalMs);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, triggerRefresh]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}

