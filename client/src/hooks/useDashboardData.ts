// src/hooks/useDashboardData.ts
// Custom hook cho Dashboard data fetching

import { useState, useCallback, useEffect } from "react";
import * as types from "../types";
import type { DatabaseConnection } from "../types";

const fetchJSON = async <T,>(
  input: RequestInfo,
  init?: RequestInit,
  connectionConfig?: DatabaseConnection & { password?: string }
): Promise<T> => {
  // Thêm connection config vào headers nếu có
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers as HeadersInit),
  };

  if (connectionConfig) {
    headers["X-DB-Host"] = connectionConfig.host;
    headers["X-DB-Port"] = String(connectionConfig.port);
    headers["X-DB-User"] = connectionConfig.user;
    headers["X-DB-Password"] = connectionConfig.password || "";
    headers["X-DB-Database"] = connectionConfig.database;
  }

  const res = await fetch(input, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json() as Promise<T>;
};

export function useDashboardData(
  minSec: number,
  connectionConfig?: DatabaseConnection & { password?: string }
) {
  const [overview, setOverview] = useState<types.OverviewResponse | null>(null);
  const [longRunning, setLongRunning] = useState<types.LongRunningItem[]>([]);
  const [deadlocks, setDeadlocks] = useState<types.DeadlocksRow[]>([]);
  const [locks, setLocks] = useState<types.LocksRow[]>([]);
  const [lockSummary, setLockSummary] = useState<types.LockSummaryRow[]>([]);
  const [autoVac, setAutoVac] = useState<types.AutoVacRow[]>([]);
  const [indexUsage, setIndexUsage] = useState<types.IndexUsageRow[]>([]);
  const [tempFiles, setTempFiles] = useState<types.TempFilesRow[]>([]);
  const [deadTuplesAutovacuum, setDeadTuplesAutovacuum] = useState<types.DeadTuplesAutovacuumRow[]>([]);
  const [dbSizes, setDbSizes] = useState<types.DbSizeRow[]>([]);
  const [connectionUsage, setConnectionUsage] = useState<types.ConnectionUsageRow | null>(null);
  const [waitEvents, setWaitEvents] = useState<types.WaitEventRow[]>([]);
  const [blockedSessions, setBlockedSessions] = useState<types.BlockedSessionsRow[]>([]);
  const [seqVsIdxScans, setSeqVsIdxScans] = useState<types.SeqVsIdxScanRow[]>([]);
  const [tableSizes, setTableSizes] = useState<types.TableSizeRow[]>([]);
  const [oldestIdleTransaction, setOldestIdleTransaction] = useState<types.OldestIdleTransactionRow[]>([]);
  const [tpsRollbackRate, setTpsRollbackRate] = useState<types.TpsRollbackRateRow[]>([]);
  const [activeWaitingSessions, setActiveWaitingSessions] = useState<types.ActiveWaitingSessionsRow | null>(null);
  const [perDbCacheHit, setPerDbCacheHit] = useState<types.PerDbCacheHitRow[]>([]);
  const [waitByLockMode, setWaitByLockMode] = useState<types.WaitByLockModeRow[]>([]);
  const [lockOverviewPerDb, setLockOverviewPerDb] = useState<types.LockOverviewPerDbRow[]>([]);
  const [walThroughput, setWalThroughput] = useState<types.WALThroughputRow | null>(null);
  const [checkpoints, setCheckpoints] = useState<types.CheckpointsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErr(null);

    try {
      const [
        ov, lr, dl, lk, lkSum, av, ix, tf,
        deadTuplesAutovacuumRes, dbSz,
        connUsage, waitEvts, blockedSess, seqIdxScans, tableSz,
        oldestIdle, tpsRollback, activeWaiting, perDbCache,
        waitByLockModeRes, lockOverviewPerDbRes,
        walThroughputRes, checkpointsRes
      ] = await Promise.all([
        fetchJSON<types.OverviewResponse>("/api/overview", undefined, connectionConfig),
        fetchJSON<types.LongRunningItem[]>(`/api/long-running?minSec=${minSec}`, undefined, connectionConfig),
        fetchJSON<types.DeadlocksRow[]>("/api/metrics/deadlocks", undefined, connectionConfig),
        fetchJSON<types.LocksRow[]>("/api/metrics/locks", undefined, connectionConfig),
        fetchJSON<types.LockSummaryRow[]>("/api/metrics/lock-summary", undefined, connectionConfig),
        fetchJSON<types.AutoVacRow[]>("/api/metrics/autovacuum", undefined, connectionConfig),
        fetchJSON<types.IndexUsageRow[]>("/api/metrics/index-usage", undefined, connectionConfig),
        fetchJSON<types.TempFilesRow[]>("/api/metrics/temp-files", undefined, connectionConfig),
        fetchJSON<types.DeadTuplesAutovacuumRow[]>("/api/metrics/dead-tuples-autovacuum", undefined, connectionConfig),
        fetchJSON<types.DbSizeRow[]>("/api/metrics/db-sizes", undefined, connectionConfig),
        fetchJSON<types.ConnectionUsageRow>("/api/metrics/connection-usage", undefined, connectionConfig),
        fetchJSON<types.WaitEventRow[]>("/api/metrics/wait-events", undefined, connectionConfig),
        fetchJSON<types.BlockedSessionsRow[]>("/api/metrics/blocked-sessions", undefined, connectionConfig),
        fetchJSON<types.SeqVsIdxScanRow[]>("/api/metrics/seq-vs-index-scans", undefined, connectionConfig),
        fetchJSON<types.TableSizeRow[]>("/api/metrics/table-sizes", undefined, connectionConfig),
        fetchJSON<types.OldestIdleTransactionRow[]>("/api/metrics/oldest-idle-transaction", undefined, connectionConfig),
        fetchJSON<types.TpsRollbackRateRow[]>("/api/metrics/tps-rollback-rate", undefined, connectionConfig),
        fetchJSON<types.ActiveWaitingSessionsRow>("/api/metrics/active-waiting-sessions", undefined, connectionConfig),
        fetchJSON<types.PerDbCacheHitRow[]>("/api/metrics/per-db-cache-hit", undefined, connectionConfig),
        fetchJSON<types.WaitByLockModeRow[]>("/api/metrics/wait-by-lock-mode", undefined, connectionConfig),
        fetchJSON<types.LockOverviewPerDbRow[]>("/api/metrics/lock-overview-per-db", undefined, connectionConfig),
        fetchJSON<types.WALThroughputRow | null>("/api/metrics/wal-throughput", undefined, connectionConfig),
        fetchJSON<types.CheckpointsRow | null>("/api/metrics/checkpoints", undefined, connectionConfig),
      ]);

      setOverview(ov);
      setLongRunning(Array.isArray(lr) ? lr : []);
      setDeadlocks(Array.isArray(dl) ? dl : []);
      setLocks(Array.isArray(lk) ? lk : []);
      setLockSummary(Array.isArray(lkSum) ? lkSum : []);
      setAutoVac(Array.isArray(av) ? av : []);
      setIndexUsage(Array.isArray(ix) ? ix : []);
      setTempFiles(Array.isArray(tf) ? tf : []);
      setDbSizes(Array.isArray(dbSz) ? dbSz : []);
      setDeadTuplesAutovacuum(Array.isArray(deadTuplesAutovacuumRes) ? deadTuplesAutovacuumRes : []);
      setConnectionUsage(connUsage ?? null);
      setWaitEvents(Array.isArray(waitEvts) ? waitEvts : []);
      setBlockedSessions(Array.isArray(blockedSess) ? blockedSess : []);
      setSeqVsIdxScans(Array.isArray(seqIdxScans) ? seqIdxScans : []);
      setTableSizes(Array.isArray(tableSz) ? tableSz : []);
      setOldestIdleTransaction(Array.isArray(oldestIdle) ? oldestIdle : []);
      setTpsRollbackRate(Array.isArray(tpsRollback) ? tpsRollback : []);
      setActiveWaitingSessions(activeWaiting ?? null);
      setPerDbCacheHit(Array.isArray(perDbCache) ? perDbCache : []);
      setWaitByLockMode(Array.isArray(waitByLockModeRes) ? waitByLockModeRes : []);
      setLockOverviewPerDb(Array.isArray(lockOverviewPerDbRes) ? lockOverviewPerDbRes : []);
      setWalThroughput(walThroughputRes);
      setCheckpoints(checkpointsRes);
    } catch (e: any) {
      setErr(e?.message ?? "Fetch error");
    } finally {
      setLoading(false);
    }
  }, [minSec, connectionConfig]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    overview,
    longRunning,
    deadlocks,
    locks,
    lockSummary,
    autoVac,
    indexUsage,
    tempFiles,
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
    loading,
    err,
    loadData,
  };
}

