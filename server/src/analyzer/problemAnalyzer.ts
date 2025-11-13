// server/src/problemAnalyzer.ts
// Problem Analyzer Module - Orchestrator + Neutral Rules
// Phân tích vấn đề từ 24 metrics theo các rule
// - Neutral rules (1, 2, 12) được xử lý tại đây
// - Read-Path rules được xử lý bởi ReadPathAnalyzer
// - Write-Path rules được xử lý bởi WritePathAnalyzer

import { ReadPathAnalyzer } from "./problemRules.read";
import { WritePathAnalyzer } from "./problemRules.write";

/**
 * Mức độ ưu tiên của vấn đề
 */
export type ProblemPriority = "High" | "Medium" | "Low";

/**
 * Loại vấn đề (category)
 */
export type ProblemCategory = 
  | "Connection"
  | "Performance"
  | "Locking"
  | "Cache"
  | "Maintenance"
  | "I/O"
  | "Transaction"
  | "Query";

/**
 * Đường dẫn vấn đề (Read Path vs Write Path)
 */
export type ProblemPath = "read" | "write" | "neutral";

/**
 * Vấn đề được phát hiện
 */
export interface Problem {
  /** ID duy nhất của vấn đề */
  id: string;
  /** Mức độ ưu tiên */
  priority: ProblemPriority;
  /** Loại vấn đề */
  category: ProblemCategory;
  /** Đường dẫn vấn đề (Read Path, Write Path, hoặc Neutral) */
  path: ProblemPath;
  /** Tiêu đề vấn đề */
  title: string;
  /** Mô tả chi tiết */
  message: string;
  /** Hành động khuyến nghị */
  action: string;
  /** Giá trị hiện tại (nếu có) */
  currentValue?: string | number;
  /** Giá trị ngưỡng (nếu có) */
  threshold?: string | number;
  /** Metadata bổ sung */
  metadata?: Record<string, any>;
  /** Timestamp phát hiện */
  detectedAt: string;
}

/**
 * Input data cho Problem Analyzer
 * Tất cả dữ liệu từ các metrics endpoints
 */
export interface ProblemAnalyzerInput {
  // Overview
  overview: {
    connectionsByState: Array<{ state: string; count: number }>;
    cacheHitPercent: number;
  } | null;
  connectionUsage: {
    current_connections: number;
    max_connections: number;
    used_percent: number;
  } | null;
  
  // Deadlocks & Locks
  deadlocks: Array<{ datname: string; deadlocks: number }>;
  locks: Array<{ mode: string; count: number }>;
  lockSummary: Array<{ mode: string; granted: number; waiting: number }>;
  blockedSessions: Array<{
    blocked_pid: number;
    blocked_user: string | null;
    blocked_query: string | null;
    blocking_pid: number;
    blocking_user: string | null;
    blocking_query: string | null;
    blocked_state: string | null;
    blocking_state: string | null;
    blocked_duration: string;
  }>;
  waitByLockMode: Array<{ locktype: string; mode: string; waiting: number; held: number }>;
  lockOverviewPerDb: Array<{ database: string; waiting_locks: number; held_locks: number; total_locks: number }>;
  
  // Performance
  indexUsage: Array<{ relname: string; idx_scan: number | null; seq_scan: number | null; idx_usage: number | null }>;
  seqVsIdxScans: Array<{
    schemaname: string;
    relname: string;
    seq_scan: number | null;
    idx_scan: number | null;
    idx_usage_percent: number | null;
    n_live_tup: number | null;
  }>;
  tableSizes: Array<{
    schemaname: string;
    relname: string;
    total_size: string;
    table_size: string;
    index_size: string;
  }>;
  
  // Sessions
  longRunning: Array<{
    pid?: number;
    user?: string;
    db?: string;
    state?: string;
    durationSec?: number;
    query?: string;
    startedAt?: string;
  }>;
  waitEvents: Array<{
    pid: number;
    usename: string | null;
    datname: string | null;
    state: string | null;
    wait_event_type: string | null;
    wait_event: string | null;
    duration: string;
    sample_query: string | null;
  }>;
  oldestIdleTransaction: Array<{
    database: string;
    pid: number;
    user: string | null;
    state: string | null;
    idle_duration: string;
    current_query: string | null;
  }>;
  activeWaitingSessions: {
    active_sessions: number;
    waiting_sessions: number;
    idle_sessions: number;
    total_sessions: number;
  } | null;
  tpsRollbackRate: Array<{
    database: string;
    xact_commit: number | null;
    xact_rollback: number | null;
    tps: number | null;
    rollback_pct: number | null;
    stats_reset: string | null;
  }>;
  perDbCacheHit: Array<{
    database: string;
    cache_hit_pct: number | null;
    blks_hit: number | null;
    blks_read: number | null;
  }>;
  
  // Maintenance
  autoVac: Array<{
    relname: string;
    n_live_tup: number | null;
    n_dead_tup: number | null;
    last_autovacuum: string | null;
    last_vacuum: string | null;
  }>;
  deadTuplesAutovacuum: Array<{
    schema: string;
    table: string;
    dead_percent: number | null;
    autovacuum_count: number | null;
    vacuum_count: number | null;
  }>;
  
  // WAL / Checkpoint / I/O
  walThroughput: {
    wal_records: number | null;
    wal_fpi: number | null;
    wal_bytes: number | null;
    wal_bytes_per_sec: number | null;
    stats_reset: string | null;
  } | null;
  checkpoints: {
    num_timed: number | null;
    num_requested: number | null;
    num_done: number | null;
    write_time: number | null;
    sync_time: number | null;
    buffers_written: number | null;
    slru_written: number | null;
    stats_reset: string | null;
  } | null;
  tempFiles: Array<{ datname: string; temp_files: number | null; temp_bytes: number | null }>;
  dbSizes: Array<{ datname: string; size: string }>;
}

/**
 * Problem Analyzer Class
 * Orchestrator - Phân tích tất cả metrics và phát hiện vấn đề theo các rule
 */
export class ProblemAnalyzer {
  private problems: Problem[] = [];
  private input: ProblemAnalyzerInput;

  constructor(input: ProblemAnalyzerInput) {
    this.input = input;
  }

  /**
   * Chạy phân tích tất cả các rule
   */
  analyze(): Problem[] {
    this.problems = [];
    
    // Neutral rules (1, 2, 12) - xử lý tại đây
    this.analyzeNeutralIssues();
    
    // Read-Path rules (3, 4, 10, 11, 11b, 13, 18)
    const readPathAnalyzer = new ReadPathAnalyzer(this.input);
    const readProblems = readPathAnalyzer.analyze();
    this.problems.push(...readProblems);
    
    // Write-Path rules (2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b)
    const writePathAnalyzer = new WritePathAnalyzer(this.input);
    const writeProblems = writePathAnalyzer.analyze();
    this.problems.push(...writeProblems);
    
    // Sắp xếp theo priority
    return this.sortByPriority(this.problems);
  }

  /**
   * Phân tích Neutral Issues (Rules 1, 2, 12)
   * Các rules không thuộc Read-Path hay Write-Path cụ thể
   */
  private analyzeNeutralIssues(): void {
    this.analyzeConnectionNeutralIssues(); // Rules 1, 2
    this.analyzeQueryNeutralIssues();      // Rule 12
  }

  /**
   * Phân tích vấn đề về Connection (Neutral)
   */
  private analyzeConnectionNeutralIssues(): void {
    const { connectionUsage, activeWaitingSessions } = this.input;

    // Rule 1: Connection Usage > 80%
    if (connectionUsage?.used_percent) {
      const usedPercent = Number(connectionUsage.used_percent);
      if (usedPercent > 80) {
        this.problems.push({
          id: "connection-usage-high",
          priority: usedPercent > 90 ? "High" : "Medium",
          category: "Connection",
          path: "neutral",
          title: "Connection Usage Quá Cao",
          message: `Connection usage đang ở ${usedPercent.toFixed(2)}% (${connectionUsage.current_connections}/${connectionUsage.max_connections} connections)`,
          action: usedPercent > 90 
            ? "Cần tăng max_connections ngay lập tức hoặc tối ưu connection pooling"
            : "Xem xét tăng max_connections hoặc tối ưu connection pooling",
          currentValue: usedPercent,
          threshold: 80,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Rule 2: Waiting Sessions > 0
    // Chỉ tạo vấn đề này nếu không có blocked sessions (Rule 7 sẽ xử lý trường hợp đó)
    // và không có I/O wait events (Rule 13 sẽ xử lý trường hợp đó)
    const hasBlockedSessions = this.input.blockedSessions.length > 0;
    const hasIOWaitEvents = this.input.waitEvents.some((r) => r.wait_event_type === "IO");
    
    if (
      activeWaitingSessions?.waiting_sessions && 
      activeWaitingSessions.waiting_sessions > 0 &&
      !hasBlockedSessions &&
      !hasIOWaitEvents
    ) {
      this.problems.push({
        id: "waiting-sessions",
        priority: "High",
        category: "Connection",
        path: "neutral",
        title: "Có Sessions Đang Chờ",
        message: `Có ${activeWaitingSessions.waiting_sessions} session đang chờ (có thể do lock hoặc I/O)`,
        action: "Kiểm tra Wait Events và Blocked Sessions để xác định nguyên nhân",
        currentValue: activeWaitingSessions.waiting_sessions,
        threshold: 0,
        metadata: {
          active: activeWaitingSessions.active_sessions,
          idle: activeWaitingSessions.idle_sessions,
          total: activeWaitingSessions.total_sessions,
        },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Phân tích vấn đề về Query (Neutral)
   */
  private analyzeQueryNeutralIssues(): void {
    const { longRunning } = this.input;

    // Rule 12: Long-running Queries > 30s (hoặc > 5 phút cho very long)
    if (longRunning.length > 0) {
      const veryLongRunning = longRunning.filter((r) => (r.durationSec ?? 0) > 300); // > 5 phút
      const longRunning30s = longRunning.filter((r) => (r.durationSec ?? 0) > 30); // > 30s
      
      if (veryLongRunning.length > 0) {
        this.problems.push({
          id: "long-running-queries",
          priority: "High",
          category: "Query",
          path: "neutral",
          title: "Có Queries Chạy Quá Lâu",
          message: `Có ${veryLongRunning.length} query(s) chạy > 5 phút (tổng ${longRunning.length} queries chạy lâu)`,
          action: "Kiểm tra và tối ưu các queries chạy lâu. Xem xét thêm index hoặc tối ưu query plan",
          currentValue: veryLongRunning.length,
          threshold: 0,
          metadata: {
            totalLongRunning: longRunning.length,
            veryLongRunning: veryLongRunning.length,
            queries: veryLongRunning.slice(0, 5).map((r) => ({
              pid: r.pid,
              duration: r.durationSec,
              query: r.query?.substring(0, 100),
            })),
          },
          detectedAt: new Date().toISOString(),
        });
      } else if (longRunning30s.length > 0) {
        this.problems.push({
          id: "long-running-queries-30s",
          priority: "Medium",
          category: "Query",
          path: "neutral",
          title: "Có Queries Chạy > 30s",
          message: `Có ${longRunning30s.length} query(s) chạy > 30 giây`,
          action: "Kiểm tra và tối ưu các queries. Xem xét thêm index hoặc tối ưu query plan",
          currentValue: longRunning30s.length,
          threshold: 30,
          metadata: {
            totalLongRunning: longRunning.length,
            queries: longRunning30s.slice(0, 5).map((r) => ({
              pid: r.pid,
              duration: r.durationSec,
              query: r.query?.substring(0, 100),
            })),
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Sắp xếp problems theo priority
   */
  private sortByPriority(problems: Problem[]): Problem[] {
    const priorityOrder: Record<ProblemPriority, number> = {
      High: 0,
      Medium: 1,
      Low: 2,
    };
    
    return [...problems].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.category.localeCompare(b.category);
    });
  }
}

/**
 * Helper function để chạy Problem Analyzer
 */
export function analyzeProblems(input: ProblemAnalyzerInput): Problem[] {
  const analyzer = new ProblemAnalyzer(input);
  return analyzer.analyze();
}
