// src/types.ts
// Tất cả TypeScript types cho Dashboard

// Database Connection Types
export type DatabaseConnection = {
  id: string;
  label: string; // Tên hiển thị
  host: string;
  port: number;
  user: string;
  database: string;
  // Password không được lưu trong localStorage, chỉ lưu khi đang active
  password?: string; // Chỉ dùng tạm thời khi connect
  createdAt: string;
  lastUsed?: string;
};

export type ConnectionState = {
  state: string;
  count: number;
};

export type OverviewResponse = {
  connectionsByState: ConnectionState[];
  cacheHitPercent: number;
};

export type LongRunningItem = {
  pid?: number;
  user?: string;
  db?: string;
  state?: string;
  durationSec?: number;
  query?: string;
  startedAt?: string;
};

export type DeadlocksRow = { datname: string; deadlocks: number };
export type LocksRow = { mode: string; count: number };
export type LockSummaryRow = { mode: string; granted: number; waiting: number };
export type AutoVacRow = {
  relname: string;
  n_live_tup: number | null;
  n_dead_tup: number | null;
  last_autovacuum: string | null;
  last_vacuum: string | null;
};
export type IndexUsageRow = {
  relname: string;
  idx_scan: number | null;
  seq_scan: number | null;
  idx_usage: number | null;
};
export type TempFilesRow = { datname: string; temp_files: number | null; temp_bytes: number | null };
export type DeadTuplesAutovacuumRow = {
  schema: string;
  table: string;
  dead_percent: number | null;
  autovacuum_count: number | null;
  vacuum_count: number | null;
};
export type DbSizeRow = { datname: string; size: string };
export type ConnectionUsageRow = { 
  current_connections: number; 
  max_connections: number; 
  used_percent: number;
};
export type WaitEventRow = { 
  pid: number; 
  usename: string | null; 
  datname: string | null; 
  state: string | null; 
  wait_event_type: string | null; 
  wait_event: string | null; 
  duration: string; 
  sample_query: string | null;
};
export type BlockedSessionsRow = { 
  blocked_pid: number; 
  blocked_user: string | null; 
  blocked_query: string | null; 
  blocking_pid: number; 
  blocking_user: string | null; 
  blocking_query: string | null; 
  blocked_state: string | null; 
  blocking_state: string | null; 
  blocked_duration: string;
};
export type SeqVsIdxScanRow = { 
  schemaname: string; 
  relname: string; 
  seq_scan: number | null; 
  idx_scan: number | null; 
  idx_usage_percent: number | null; 
  n_live_tup: number | null;
};
export type TableSizeRow = { 
  schemaname: string; 
  relname: string; 
  total_size: string; 
  table_size: string; 
  index_size: string;
};
export type TempIoRow = {
  datname: string;
  bytes_per_sec: number | null;
  files_per_sec: number | null;
};
export type CheckpointFreqRow = {
  buffers_clean_per_sec: number | null;
  buffers_checkpoint_per_sec: number | null;
};

// Session Metrics Types
export type OldestIdleTransactionRow = {
  database: string;
  pid: number;
  user: string | null;
  state: string | null;
  idle_duration: string;
  current_query: string | null;
};

export type TpsRollbackRateRow = {
  database: string;
  xact_commit: number | null;
  xact_rollback: number | null;
  tps: number | null;
  rollback_pct: number | null;
  stats_reset: string | null;
};

export type ActiveWaitingSessionsRow = {
  active_sessions: number;
  waiting_sessions: number;
  idle_sessions: number;
  total_sessions: number;
};

export type PerDbCacheHitRow = {
  database: string;
  cache_hit_pct: number | null;
  blks_hit: number | null;
  blks_read: number | null;
};

export type WaitByLockModeRow = {
  locktype: string;
  mode: string;
  waiting: number;
  held: number;
};

export type LockOverviewPerDbRow = {
  database: string;
  waiting_locks: number;
  held_locks: number;
  total_locks: number;
};

// WAL / Checkpoint / I/O Types
export type WALThroughputRow = {
  wal_records: number | null;
  wal_fpi: number | null;
  wal_bytes: number | null;
  wal_bytes_per_sec: number | null;
  stats_reset: string | null;
};

export type CheckpointsRow = {
  num_timed: number | null;
  num_requested: number | null;
  num_done: number | null;
  write_time: number | null;
  sync_time: number | null;
  buffers_written: number | null;
  slru_written: number | null;
  stats_reset: string | null;
};

// Problem Analyzer Types (from backend)
export type ProblemPriority = "High" | "Medium" | "Low";
export type ProblemCategory = 
  | "Connection"
  | "Performance"
  | "Locking"
  | "Cache"
  | "Maintenance"
  | "I/O"
  | "Transaction"
  | "Query";

export type ProblemPath = "read" | "write" | "neutral";

export type Problem = {
  id: string;
  priority: ProblemPriority;
  category: ProblemCategory;
  path: ProblemPath;
  title: string;
  message: string;
  action: string;
  currentValue?: string | number;
  threshold?: string | number;
  metadata?: Record<string, any>;
  detectedAt: string;
};
