// src/Dashboard.tsx
// Main Dashboard component - refactored to use smaller components

import React from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { usePreset } from "./hooks/usePreset";
import { useAutoRefresh } from "./hooks/useAutoRefresh";
import { DashboardHeader } from "./components/ui/Dashboard/DashboardHeader";
import { ErrorDisplay } from "./components/ui/Shared/ErrorDisplay";
import { OverviewSection } from "./components/sections/OverviewSection";
import { MetricsTabs } from "./components/ui/Dashboard/MetricsTabs";
import { useDatabaseConnectionContext } from "./contexts/DatabaseConnectionContext";

const Dashboard: React.FC = () => {
  // Get connection context
  const { connection } = useDatabaseConnectionContext();

  // Load preset từ localStorage
  const { preset, isLoaded, updateMinSec, updateAutoRefresh } = usePreset();


  // Chỉ sử dụng preset khi đã load xong (tránh flash với giá trị mặc định)
  const minSec = isLoaded ? preset.minSec : 60;
  const autoRefreshEnabled = isLoaded ? preset.autoRefresh.enabled : false;
  const autoRefreshInterval = isLoaded ? preset.autoRefresh.interval : 30;

  // Handler để update minSec và lưu vào preset
  const handleMinSecChange = React.useCallback((value: number) => {
    updateMinSec(value);
  }, [updateMinSec]);

  // Handler để toggle auto-refresh
  const handleAutoRefreshToggle = React.useCallback((enabled: boolean) => {
    updateAutoRefresh(enabled);
  }, [updateAutoRefresh]);

  // Handler để thay đổi interval
  const handleAutoRefreshIntervalChange = React.useCallback((interval: 10 | 30 | 60) => {
    updateAutoRefresh(autoRefreshEnabled, interval);
  }, [updateAutoRefresh, autoRefreshEnabled]);

  const {
    overview,
    longRunning,
    deadlocks,
    locks,
    lockSummary,
    autoVac,
    indexUsage,
    deadTuplesAutovacuum,
    dbSizes,
    connectionUsage,
    waitEvents,
    blockedSessions,
    seqVsIdxScans,
    tableSizes,
    oldestIdleTransaction,
    tpsRollbackRate,
    activeWaitingSessions,
    perDbCacheHit,
    waitByLockMode,
    lockOverviewPerDb,
    walThroughput,
    checkpoints,
    tempFiles,
    loading,
    err,
    loadData,
  } = useDashboardData(minSec, connection || undefined);

  // Refresh trigger để force refresh Problem Analyzer khi metrics refresh
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Tăng refreshTrigger mỗi khi loadData hoàn thành
  React.useEffect(() => {
    if (!loading) {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [loading]);


  // Auto-refresh hook - chỉ chạy khi đã load preset xong
  useAutoRefresh({
    enabled: isLoaded && autoRefreshEnabled,
    interval: autoRefreshInterval,
    onRefresh: loadData,
    loading: loading,
  });

  return (
    <div style={{ 
      padding: "24px 32px", 
      maxWidth: "100%", 
      width: "100%",
      margin: "0 auto", 
      fontFamily: "system-ui, sans-serif",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch"
    }}>
      <DashboardHeader
        minSec={minSec}
        onMinSecChange={handleMinSecChange}
        onRefresh={loadData}
        autoRefreshEnabled={autoRefreshEnabled}
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshToggle={handleAutoRefreshToggle}
        onAutoRefreshIntervalChange={handleAutoRefreshIntervalChange}
      />

      {loading && <p>Loading…</p>}
      {err && <ErrorDisplay error={err} />}

      <OverviewSection 
        overview={overview}
        connectionUsage={connectionUsage}
        deadlocks={deadlocks}
      />

      <MetricsTabs
        longRunning={longRunning}
        minSec={minSec}
        waitEvents={waitEvents}
        oldestIdleTransaction={oldestIdleTransaction}
        tpsRollbackRate={tpsRollbackRate}
        activeWaitingSessions={activeWaitingSessions}
        perDbCacheHit={perDbCacheHit}
        deadlocks={deadlocks}
        locks={locks}
        lockSummary={lockSummary}
        blockedSessions={blockedSessions}
        waitByLockMode={waitByLockMode}
        lockOverviewPerDb={lockOverviewPerDb}
        overview={overview}
        connectionUsage={connectionUsage}
        indexUsage={indexUsage}
        seqVsIdxScans={seqVsIdxScans}
        tableSizes={tableSizes}
        dbSizes={dbSizes}
        autoVac={autoVac}
        deadTuplesAutovacuum={deadTuplesAutovacuum}
        walThroughput={walThroughput}
        checkpoints={checkpoints}
        tempFiles={tempFiles}
        currentDatabase={connection?.database}
        connection={connection || undefined}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Dashboard;
