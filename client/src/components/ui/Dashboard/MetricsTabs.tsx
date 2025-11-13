// src/components/ui/MetricsTabs.tsx
// Tab system for organizing metrics into specialized views

import React, { useState } from "react";
import type * as types from "../../../types";
import type { DatabaseConnection } from "../../../types";
import { useThemeStyles } from "../../../utils/themeStyles";
import { useTranslation } from "../../../utils/i18n";
import { LongRunningSection } from "../../cards/Sessions/LongRunningCard";
import { TempIOAndCheckpointSection } from "../../cards/Maintenance/DeadTuplesAutovacuumCard";
import { WaitEventsCard } from "../../cards/Sessions/WaitEventsCard";
import { BlockedSessionsCard } from "../../cards/Locks/BlockedSessionsCard";
import { SeqVsIdxScansCard } from "../../cards/Performance/SeqVsIdxScansCard";
import { TableSizesCard } from "../../cards/Performance/TableSizesCard";
import { DeadlocksCard } from "../../cards/Locks/DeadlocksCard";
import { LocksCard } from "../../cards/Locks/LocksCard";
import { LockSummaryCard } from "../../cards/Locks/LockSummaryCard";
import { WaitByLockModeCard } from "../../cards/Locks/WaitByLockModeCard";
import { LockOverviewPerDbCard } from "../../cards/Locks/LockOverviewPerDBCard";
import { AutovacuumCard } from "../../cards/Maintenance/AutovacuumCard";
import { IndexUsageCard } from "../../cards/Performance/IndexUsageCard";
import { OldestIdleTransactionCard } from "../../cards/Sessions/OldestIdleTransactionCard";
import { TpsRollbackRateCard } from "../../cards/Sessions/TpsRollbackRateCard";
import { ActiveWaitingSessionsCard } from "../../cards/Sessions/ActiveWaitingSessionsCard";
import { PerDbCacheHitCard } from "../../cards/Sessions/PerDbCacheHitCard";
import { WALThroughputCard } from "../../cards/WALCheckpointIO/WALThroughputCard";
import { CheckpointsCard } from "../../cards/WALCheckpointIO/CheckpointsCard";
import { TempFilesCard } from "../../cards/WALCheckpointIO/TempFilesCard";
import { DatabaseSizesCard as WALDatabaseSizesCard } from "../../cards/WALCheckpointIO/DatabaseSizesCard";
import { ProblemDetectionTab } from "./ProblemDetectionTab";

interface MetricsTabsProps {
  // Sessions Tab
  longRunning: types.LongRunningItem[];
  minSec: number;
  refreshTrigger?: number; // Trigger để refresh Problem Analyzer
  waitEvents: types.WaitEventRow[];
  oldestIdleTransaction: types.OldestIdleTransactionRow[];
  tpsRollbackRate: types.TpsRollbackRateRow[];
  activeWaitingSessions: types.ActiveWaitingSessionsRow | null;
  perDbCacheHit: types.PerDbCacheHitRow[];
  
  // Locks & Blocking Tab
  deadlocks: types.DeadlocksRow[];
  locks: types.LocksRow[];
  lockSummary: types.LockSummaryRow[];
  blockedSessions: types.BlockedSessionsRow[];
  waitByLockMode: types.WaitByLockModeRow[];
  lockOverviewPerDb: types.LockOverviewPerDbRow[];
  
  // Performance Tab
  overview: types.OverviewResponse | null;
  connectionUsage: types.ConnectionUsageRow | null;
  indexUsage: types.IndexUsageRow[];
  seqVsIdxScans: types.SeqVsIdxScanRow[];
  tableSizes: types.TableSizeRow[];
  dbSizes: types.DbSizeRow[];
  
  // Maintenance Tab
  autoVac: types.AutoVacRow[];
  deadTuplesAutovacuum: types.DeadTuplesAutovacuumRow[];
  
  // WAL / Checkpoint / I/O Tab
  walThroughput: types.WALThroughputRow | null;
  checkpoints: types.CheckpointsRow | null;
  tempFiles: types.TempFilesRow[];
  
  // Current database filter
  currentDatabase?: string;
  
  // Connection for Problem Detection Tab
  connection?: DatabaseConnection & { password?: string };
}

type TabId = "sessions" | "locks" | "performance" | "maintenance" | "walCheckpointIO" | "problemDetection";

export const MetricsTabs: React.FC<MetricsTabsProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabId>("problemDetection");
  const theme = useThemeStyles();

  const tabStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    borderBottom: `2px solid ${theme.border.default}`,
    flexWrap: "wrap",
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? (theme.isDark ? "#60a5fa" : "#1976d2") : theme.text.secondary,
    backgroundColor: "transparent",
    border: "none",
    borderBottom: isActive ? `3px solid ${theme.isDark ? "#60a5fa" : "#1976d2"}` : "3px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    borderRadius: "4px 4px 0 0",
  });

  const tabContentStyle: React.CSSProperties = {
    padding: "16px 0",
  };

  const { t } = useTranslation();
  
  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: "sessions", label: t("sessions"), icon: "👥" },
    { id: "locks", label: t("locks_blocking"), icon: "🔒" },
    { id: "performance", label: t("performance"), icon: "⚡" },
    { id: "maintenance", label: t("maintenance"), icon: "🧹" },
    { id: "walCheckpointIO", label: "WAL / Checkpoint / I/O", icon: "💾" },
    { id: "problemDetection", label: "Phát Hiện Vấn Đề", icon: "🔍" },

  ];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={tabStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
            type="button"
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={tabContentStyle}>
        {activeTab === "problemDetection" && (
          <ProblemDetectionTab
            minSec={props.minSec}
            connection={props.connection}
            refreshTrigger={props.refreshTrigger}
          />
        )}

        {activeTab === "sessions" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <ActiveWaitingSessionsCard activeWaitingSessions={props.activeWaitingSessions} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <OldestIdleTransactionCard oldestIdleTransaction={props.oldestIdleTransaction} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <LongRunningSection longRunning={props.longRunning} minSec={props.minSec} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <WaitEventsCard waitEvents={props.waitEvents} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <TpsRollbackRateCard tpsRollbackRate={props.tpsRollbackRate} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <PerDbCacheHitCard perDbCacheHit={props.perDbCacheHit} />
            </div>
          </div>
        )}

        {activeTab === "locks" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
            <DeadlocksCard deadlocks={props.deadlocks} />
            <LocksCard locks={props.locks} />
            <LockSummaryCard lockSummary={props.lockSummary} />
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <WaitByLockModeCard waitByLockMode={props.waitByLockMode} />
              <LockOverviewPerDbCard lockOverviewPerDb={props.lockOverviewPerDb} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <BlockedSessionsCard blockedSessions={props.blockedSessions} />
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
            {/* Cache Hit % - Full width, compact */}
            {props.overview && (
              <div style={{ gridColumn: "1 / -1", border: `1px solid ${theme.border.default}`, borderRadius: 12, padding: "12px 16px", backgroundColor: theme.bg.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 18, color: theme.text.primary }}>Cache Hit %</h2>
                <div style={{ fontSize: 32, fontWeight: 700, color: theme.text.primary }}>
                  {props.overview.cacheHitPercent.toFixed(2)}%
                </div>
              </div>
            )}
            {/* Index Usage - Full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <IndexUsageCard indexUsage={props.indexUsage} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <SeqVsIdxScansCard seqVsIdxScans={props.seqVsIdxScans} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <TableSizesCard tableSizes={props.tableSizes} />
            </div>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <AutovacuumCard autoVac={props.autoVac} />
            </div>
            {/* Advanced Autovacuum Metrics */}
            <div style={{ gridColumn: "1 / -1" }}>
              <TempIOAndCheckpointSection
                deadTuplesAutovacuum={props.deadTuplesAutovacuum}
              />
            </div>
          </div>
        )}

        {activeTab === "walCheckpointIO" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <WALThroughputCard walThroughput={props.walThroughput} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <CheckpointsCard checkpoints={props.checkpoints} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <TempFilesCard tempFiles={props.tempFiles} currentDatabase={props.currentDatabase} />
              <WALDatabaseSizesCard dbSizes={props.dbSizes} currentDatabase={props.currentDatabase} />
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

