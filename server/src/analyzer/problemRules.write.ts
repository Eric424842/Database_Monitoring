// server/src/problemRules.write.ts
// Write-Path Rules - Phân tích vấn đề liên quan đến ghi (Write operations)
// Rules: 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b

import type { Problem, ProblemAnalyzerInput } from "./problemAnalyzer";

/**
 * Write-Path Analyzer
 * Phân tích các vấn đề liên quan đến Write Path (locks, deadlocks, WAL, checkpoints, autovacuum...)
 */
export class WritePathAnalyzer {
  private problems: Problem[] = [];
  private input: ProblemAnalyzerInput;

  constructor(input: ProblemAnalyzerInput) {
    this.input = input;
  }

  /**
   * Phân tích tất cả Write-Path rules
   */
  analyze(): Problem[] {
    this.problems = [];
    
    this.analyzeConnectionWriteIssues(); // Rule 2b
    this.analyzeLockingIssues();         // Rules 5, 6, 7, 8, 9, 9b
    this.analyzeTransactionIssues();    // Rules 14, 15
    this.analyzeMaintenanceIssues();     // Rules 16, 17
    this.analyzeIOWriteIssues();         // Rules 19, 20, 20b
    
    return this.problems;
  }

  /**
   * Phân tích vấn đề về Connection (Write-Path)
   */
  private analyzeConnectionWriteIssues(): void {
    const { overview } = this.input;

    // Rule 2b: Connections by State - Quá nhiều idle in transaction
    if (overview?.connectionsByState) {
      const idleInTransaction = overview.connectionsByState.find((c) => c.state === "idle in transaction");
      if (idleInTransaction && idleInTransaction.count > 5) {
        this.problems.push({
          id: "idle-in-transaction-high",
          priority: "High",
          category: "Connection",
          path: "write",
          title: "Quá Nhiều Idle in Transaction",
          message: `Có ${idleInTransaction.count} connection đang idle in transaction - có nguy cơ giữ lock`,
          action: "Kiểm tra và kill các idle transactions. Xem xét thiết lập idle_in_transaction_session_timeout",
          currentValue: idleInTransaction.count,
          threshold: 5,
          metadata: {
            connectionsByState: overview.connectionsByState,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Phân tích vấn đề về Locking (Write-Path)
   */
  private analyzeLockingIssues(): void {
    const { deadlocks, locks, lockSummary, blockedSessions, waitByLockMode, lockOverviewPerDb } = this.input;

    // Rule 5: Deadlocks > 0
    const totalDeadlocks = deadlocks.reduce((sum, r) => sum + (r.deadlocks || 0), 0);
    if (totalDeadlocks > 0) {
      const deadlockDBs = deadlocks.filter((r) => r.deadlocks > 0);
      this.problems.push({
        id: "deadlocks-detected",
        priority: "High",
        category: "Locking",
        path: "write",
        title: "Phát Hiện Deadlocks",
        message: `Tổng cộng ${totalDeadlocks} deadlock(s) trong ${deadlockDBs.length} database(s)`,
        action: "Kiểm tra và tối ưu các transaction có thể gây deadlock. Xem xét thứ tự lock và timeout",
        currentValue: totalDeadlocks,
        threshold: 0,
        metadata: {
          databases: deadlockDBs.map((r) => ({
            database: r.datname,
            deadlocks: r.deadlocks,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 6: Lock Summary - Waiting > 0
    const waitingLocks = lockSummary.filter((r) => r.waiting > 0);
    if (waitingLocks.length > 0) {
      const totalWaiting = waitingLocks.reduce((sum, r) => sum + r.waiting, 0);
      this.problems.push({
        id: "lock-summary-waiting",
        priority: "High",
        category: "Locking",
        path: "write",
        title: "Có Locks Đang Chờ",
        message: `Tổng cộng ${totalWaiting} lock(s) đang chờ (waiting)`,
        action: "Kiểm tra Blocked Sessions và các query đang giữ lock quá lâu",
        currentValue: totalWaiting,
        threshold: 0,
        metadata: {
          locksByMode: waitingLocks.map((r) => ({
            mode: r.mode,
            waiting: r.waiting,
            granted: r.granted,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 7: Blocked Sessions > 0
    if (blockedSessions.length > 0) {
      this.problems.push({
        id: "blocked-sessions",
        priority: "High",
        category: "Locking",
        path: "write",
        title: "Có Sessions Bị Block",
        message: `Có ${blockedSessions.length} session(s) đang bị block bởi lock`,
        action: "Kiểm tra blocking queries và xem xét kill các long-running transactions đang giữ lock",
        currentValue: blockedSessions.length,
        threshold: 0,
        metadata: {
          blockedPids: blockedSessions.map((r) => r.blocked_pid),
          blockingPids: blockedSessions.map((r) => r.blocking_pid),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 8: Wait by Lock Mode - Waiting > 0
    const waitingByMode = waitByLockMode.filter((r) => r.waiting > 0);
    if (waitingByMode.length > 0) {
      const totalWaiting = waitingByMode.reduce((sum, r) => sum + r.waiting, 0);
      this.problems.push({
        id: "wait-by-lock-mode",
        priority: "High",
        category: "Locking",
        path: "write",
        title: "Locks Đang Chờ Theo Mode",
        message: `Có ${totalWaiting} lock(s) đang chờ theo ${waitingByMode.length} lock mode(s)`,
        action: "Phân tích lock mode để xác định loại lock đang gây vấn đề",
        currentValue: totalWaiting,
        threshold: 0,
        metadata: {
          locksByType: waitingByMode.map((r) => ({
            locktype: r.locktype,
            mode: r.mode,
            waiting: r.waiting,
            held: r.held,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 9: Lock Overview per DB - Waiting > 0
    const waitingPerDb = lockOverviewPerDb.filter((r) => r.waiting_locks > 0);
    if (waitingPerDb.length > 0) {
      const totalWaiting = waitingPerDb.reduce((sum, r) => sum + r.waiting_locks, 0);
      this.problems.push({
        id: "lock-overview-per-db-waiting",
        priority: "High",
        category: "Locking",
        path: "write",
        title: "Locks Đang Chờ Theo Database",
        message: `${waitingPerDb.length} database có locks đang chờ (tổng ${totalWaiting} locks)`,
        action: "Kiểm tra các database có waiting locks và xác định nguyên nhân",
        currentValue: totalWaiting,
        threshold: 0,
        metadata: {
          databases: waitingPerDb.map((r) => ({
            database: r.database,
            waiting: r.waiting_locks,
            held: r.held_locks,
            total: r.total_locks,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 9b: Current Locks by Mode - Tổng số locks quá cao
    if (locks.length > 0) {
      const totalLocks = locks.reduce((sum, r) => sum + (r.count || 0), 0);
      if (totalLocks > 1000) {
        const topLockModes = locks
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 5);
        
        this.problems.push({
          id: "current-locks-high",
          priority: "Medium",
          category: "Locking",
          path: "write",
          title: "Tổng Số Locks Quá Cao",
          message: `Tổng cộng ${totalLocks} locks đang active. Top 5 lock modes: ${topLockModes.map((r) => `${r.mode} (${r.count})`).join(", ")}`,
          action: "Kiểm tra các transaction đang giữ nhiều locks. Xem xét tối ưu queries và giảm transaction duration",
          currentValue: totalLocks,
          threshold: 1000,
          metadata: {
            lockModes: topLockModes.map((r) => ({
              mode: r.mode,
              count: r.count,
            })),
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Phân tích vấn đề về Transaction (Write-Path)
   */
  private analyzeTransactionIssues(): void {
    const { oldestIdleTransaction, tpsRollbackRate } = this.input;

    // Rule 14: Oldest Idle-in-Transaction
    if (oldestIdleTransaction.length > 0) {
      this.problems.push({
        id: "oldest-idle-transaction",
        priority: "High",
        category: "Transaction",
        path: "write",
        title: "Có Transactions Idle Quá Lâu",
        message: `Có ${oldestIdleTransaction.length} transaction(s) đang idle in transaction - có nguy cơ giữ lock`,
        action: "Kiểm tra và kill các idle transactions. Xem xét thiết lập idle_in_transaction_session_timeout",
        currentValue: oldestIdleTransaction.length,
        threshold: 0,
        metadata: {
          transactions: oldestIdleTransaction.slice(0, 5).map((r) => ({
            pid: r.pid,
            database: r.database,
            idleDuration: r.idle_duration,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 15: TPS & Rollback Rate > 5%
    const highRollbackRate = tpsRollbackRate.filter(
      (r) => r.rollback_pct !== null && r.rollback_pct !== undefined && Number(r.rollback_pct) > 5
    );
    if (highRollbackRate.length > 0) {
      const dbNames = highRollbackRate.slice(0, 3).map((r) => r.database).join(", ");
      const moreText = highRollbackRate.length > 3 ? ` và ${highRollbackRate.length - 3} database khác` : "";
      
      this.problems.push({
        id: "rollback-rate-high",
        priority: "High",
        category: "Transaction",
        path: "write",
        title: "Tỷ Lệ Rollback Cao",
        message: `${highRollbackRate.length} database có rollback rate > 5% (${dbNames}${moreText})`,
        action: "Kiểm tra logs và transaction design. Có thể do lỗi logic ứng dụng hoặc deadlock",
        currentValue: highRollbackRate.length,
        threshold: 5,
        metadata: {
          databases: highRollbackRate.map((r) => ({
            database: r.database,
            rollbackPct: r.rollback_pct,
            tps: r.tps,
            commits: r.xact_commit,
            rollbacks: r.xact_rollback,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Phân tích vấn đề về Maintenance (Write-Path)
   */
  private analyzeMaintenanceIssues(): void {
    const { deadTuplesAutovacuum, autoVac } = this.input;

    // Rule 16: Dead Tuples & Autovacuum Count - Dead % > 50%
    const highDeadPercent = deadTuplesAutovacuum.filter(
      (r) => r.dead_percent !== null && r.dead_percent !== undefined && Number(r.dead_percent) > 50
    );
    if (highDeadPercent.length > 0) {
      const tableNames = highDeadPercent.slice(0, 3).map((r) => `${r.schema}.${r.table}`).join(", ");
      const moreText = highDeadPercent.length > 3 ? ` và ${highDeadPercent.length - 3} bảng khác` : "";
      
      this.problems.push({
        id: "dead-tuples-high",
        priority: "High",
        category: "Maintenance",
        path: "write",
        title: "Dead Tuples Quá Nhiều",
        message: `${highDeadPercent.length} bảng có dead tuples > 50% (${tableNames}${moreText})`,
        action: "Chạy VACUUM thủ công hoặc điều chỉnh autovacuum settings. Dead tuples cao làm chậm queries và tốn disk",
        currentValue: highDeadPercent.length,
        threshold: 50,
        metadata: {
          tables: highDeadPercent.map((r) => ({
            schema: r.schema,
            table: r.table,
            deadPercent: r.dead_percent,
            autovacuumCount: r.autovacuum_count,
            vacuumCount: r.vacuum_count,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 17: Autovacuum chưa chạy lâu
    const noRecentAutovacuum = autoVac.filter((r) => {
      if (!r.last_autovacuum) return true;
      try {
        const lastVacuum = new Date(r.last_autovacuum);
        const daysSince = (Date.now() - lastVacuum.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 7; // > 7 ngày
      } catch {
        return true; // Invalid date, treat as no recent autovacuum
      }
    });
    if (noRecentAutovacuum.length > 0) {
      const tableNames = noRecentAutovacuum.slice(0, 3).map((r) => r.relname).join(", ");
      const moreText = noRecentAutovacuum.length > 3 ? ` và ${noRecentAutovacuum.length - 3} bảng khác` : "";
      
      this.problems.push({
        id: "autovacuum-not-recent",
        priority: "Medium",
        category: "Maintenance",
        path: "write",
        title: "Autovacuum Chưa Chạy Lâu",
        message: `${noRecentAutovacuum.length} bảng chưa có autovacuum trong > 7 ngày (${tableNames}${moreText})`,
        action: "Kiểm tra autovacuum settings và xem xét chạy VACUUM thủ công cho các bảng này",
        currentValue: noRecentAutovacuum.length,
        threshold: 7,
        metadata: {
          tables: noRecentAutovacuum.map((r) => ({
            table: r.relname,
            lastAutovacuum: r.last_autovacuum,
            deadTuples: r.n_dead_tup,
            liveTuples: r.n_live_tup,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Phân tích vấn đề về I/O Write (Write-Path)
   */
  private analyzeIOWriteIssues(): void {
    const { walThroughput, checkpoints, dbSizes } = this.input;

    // Rule 19: WAL Throughput cao
    if (walThroughput?.wal_bytes_per_sec) {
      const walBytesPerSec = Number(walThroughput.wal_bytes_per_sec);
      if (walBytesPerSec > 100000000) { // > 100 MB/s
        this.problems.push({
          id: "wal-throughput-high",
          priority: "Medium",
          category: "I/O",
          path: "write",
          title: "WAL Throughput Cao",
          message: `WAL throughput: ${this.formatBytes(walBytesPerSec)}/s`,
          action: "WAL throughput cao cho thấy write workload lớn. Xem xét tối ưu writes hoặc tăng WAL buffers",
          currentValue: walBytesPerSec,
          threshold: 100000000,
          metadata: {
            walRecords: walThroughput.wal_records,
            walFpi: walThroughput.wal_fpi,
            walBytes: walThroughput.wal_bytes,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Rule 20: Checkpoints quá thường xuyên
    if (checkpoints?.num_done) {
      const numDone = Number(checkpoints.num_done);
      const writeTime = checkpoints.write_time ? Number(checkpoints.write_time) : 0;
      const syncTime = checkpoints.sync_time ? Number(checkpoints.sync_time) : 0;
      
      if (numDone > 100 && (writeTime + syncTime) > 1000) {
        this.problems.push({
          id: "checkpoints-too-frequent",
          priority: "Medium",
          category: "I/O",
          path: "write",
          title: "Checkpoints Quá Thường Xuyên",
          message: `Đã có ${numDone} checkpoints với write time ${writeTime.toFixed(2)}ms và sync time ${syncTime.toFixed(2)}ms`,
          action: "Xem xét điều chỉnh checkpoint_timeout hoặc max_wal_size để giảm tần suất checkpoint",
          currentValue: numDone,
          threshold: 100,
          metadata: {
            numTimed: checkpoints.num_timed,
            numRequested: checkpoints.num_requested,
            numDone: checkpoints.num_done,
            writeTime: checkpoints.write_time,
            syncTime: checkpoints.sync_time,
            buffersWritten: checkpoints.buffers_written,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Rule 20b: Database Sizes - Tăng trưởng nhanh hoặc quá lớn
    if (dbSizes.length > 0) {
      const parseSize = (sizeStr: string | undefined): number => {
        if (!sizeStr) return 0;
        const units: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (!match || !match[1] || !match[2]) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        return value * (units[unit] || 0);
      };

      const veryLargeDBs = dbSizes.filter((r) => {
        const sizeBytes = parseSize(r.size);
        return sizeBytes > 100 * 1024 * 1024 * 1024; // > 100 GB
      });

      if (veryLargeDBs.length > 0) {
        const dbNames = veryLargeDBs.slice(0, 3).map((r) => r.datname).join(", ");
        const moreText = veryLargeDBs.length > 3 ? ` và ${veryLargeDBs.length - 3} database khác` : "";
        
        this.problems.push({
          id: "database-sizes-large",
          priority: "Low",
          category: "I/O",
          path: "write",
          title: "Database Quá Lớn",
          message: `${veryLargeDBs.length} database có kích thước > 100 GB (${dbNames}${moreText})`,
          action: "Kiểm tra bloat, dữ liệu không cần thiết, và xem xét archive dữ liệu cũ. Sử dụng Database Sizes để theo dõi tăng trưởng",
          currentValue: veryLargeDBs.length,
          threshold: 0,
          metadata: {
            databases: veryLargeDBs.map((r) => ({
              database: r.datname,
              size: r.size,
            })),
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Format bytes thành human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

