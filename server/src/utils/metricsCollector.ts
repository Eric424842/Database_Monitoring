// server/src/utils/metricsCollector.ts
// Shared metrics collection logic for Problem Analyzer
// Được dùng bởi cả /api/problems endpoint và scheduler

import { Pool, PoolClient, QueryResultRow } from "pg";
import type { ProblemAnalyzerInput } from "../analyzer/problemAnalyzer";

/**
 * Query executor interface - hỗ trợ cả Pool và PoolClient
 */
type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<{ rows: T[]; rowCount: number | null }>;
};

/**
 * Helper để tạo query executor từ Pool hoặc PoolClient
 */
function createQueryExecutor(poolOrClient: Pool | PoolClient): QueryExecutor {
  return {
    async query<T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
      const result = await poolOrClient.query<T>(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    },
  };
}

/**
 * Thu thập tất cả metrics cần thiết cho Problem Analyzer
 * Hỗ trợ cả Pool (từ index.ts) và PoolClient (từ scheduler.ts)
 */
export async function collectMetricsForAnalyzer(
  poolOrClient: Pool | PoolClient,
  minSec: number = 60
): Promise<ProblemAnalyzerInput> {
  const executor = createQueryExecutor(poolOrClient);

  const [
    overviewRes,
    cacheHitPercentRes,
    connectionUsageRes,
    deadlocksRes,
    locksRes,
    lockSummaryRes,
    blockedSessionsRes,
    waitByLockModeRes,
    lockOverviewPerDbRes,
    indexUsageRes,
    seqVsIdxScansRes,
    tableSizesRes,
    longRunningRes,
    waitEventsRes,
    oldestIdleTransactionRes,
    activeWaitingSessionsRes,
    tpsRollbackRateRes,
    perDbCacheHitRes,
    autoVacRes,
    deadTuplesAutovacuumRes,
    walThroughputRes,
    checkpointsRes,
    tempFilesRes,
    dbSizesRes,
  ] = await Promise.all([
    // Overview - Connections by State
    executor.query<{ state: string; count: number }>(`
      SELECT COALESCE(state, 'unknown') AS state, COUNT(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY COALESCE(state, 'unknown')
      ORDER BY count DESC;
    `).then(res => res.rows),
    
    // Overview - Cache Hit Percent
    executor.query<{ hit: number | null }>(`
      SELECT CASE
               WHEN (SUM(blks_hit) + SUM(blks_read)) = 0 THEN 100.0
               ELSE ROUND(100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit) + SUM(blks_read),0), 1)
             END AS hit
      FROM pg_stat_database
      WHERE datname = current_database();
    `).then(res => Number(res.rows[0]?.hit ?? 0)),
    
    // Connection Usage
    executor.query<{ current_connections: number; max_connections: number; used_percent: number }>(`
      SELECT
        current_connections,
        max_connections,
        ROUND(100.0 * current_connections / max_connections, 2) AS used_percent
      FROM (
        SELECT
          COUNT(*) AS current_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
        FROM pg_stat_activity
      ) AS s;
    `).then(res => res.rows[0] ?? null),
    
    // Deadlocks & Locks
    executor.query<{ datname: string; deadlocks: number }>(`
      SELECT datname, deadlocks::int AS deadlocks
      FROM pg_stat_database
      ORDER BY deadlocks DESC;
    `).then(res => res.rows),
    
    executor.query<{ mode: string; count: number }>(`
      SELECT mode, COUNT(*)::int AS count
      FROM pg_locks
      GROUP BY mode
      ORDER BY count DESC;
    `).then(res => res.rows),
    
    executor.query<{ mode: string; granted: number; waiting: number }>(`
      SELECT
        l.mode,
        SUM(CASE WHEN l.granted THEN 1 ELSE 0 END)::int AS granted,
        SUM(CASE WHEN NOT l.granted THEN 1 ELSE 0 END)::int AS waiting
      FROM pg_locks AS l
      GROUP BY l.mode
      ORDER BY waiting DESC, granted DESC, mode;
    `).then(res => res.rows),
    
    executor.query<{
      blocked_pid: number;
      blocked_user: string | null;
      blocked_query: string | null;
      blocking_pid: number;
      blocking_user: string | null;
      blocking_query: string | null;
      blocked_state: string | null;
      blocking_state: string | null;
      blocked_duration: string;
    }>(`
      SELECT
        blocked.pid       AS blocked_pid,
        blocked.usename   AS blocked_user,
        blocked.query     AS blocked_query,
        blocking.pid      AS blocking_pid,
        blocking.usename  AS blocking_user,
        blocking.query    AS blocking_query,
        blocked.state     AS blocked_state,
        blocking.state    AS blocking_state,
        (now() - blocked.query_start)::text AS blocked_duration
      FROM pg_locks bl
      JOIN pg_stat_activity blocked  ON bl.pid = blocked.pid
      JOIN pg_locks kl               ON kl.locktype = bl.locktype
                                       AND kl.database IS NOT DISTINCT FROM bl.database
                                       AND kl.relation IS NOT DISTINCT FROM bl.relation
                                       AND kl.page IS NOT DISTINCT FROM bl.page
                                       AND kl.tuple IS NOT DISTINCT FROM bl.tuple
                                       AND kl.virtualxid IS NOT DISTINCT FROM bl.virtualxid
                                       AND kl.transactionid IS NOT DISTINCT FROM bl.transactionid
                                       AND kl.classid IS NOT DISTINCT FROM bl.classid
                                       AND kl.objid IS NOT DISTINCT FROM bl.objid
                                       AND kl.objsubid IS NOT DISTINCT FROM bl.objsubid
      JOIN pg_stat_activity blocking ON kl.pid = blocking.pid
      WHERE NOT bl.granted
      ORDER BY now() - blocked.query_start DESC
      LIMIT 20;
    `).then(res => res.rows),
    
    executor.query<{ locktype: string; mode: string; waiting: number; held: number }>(`
      SELECT
        locktype,
        mode,
        COUNT(*) FILTER (WHERE granted = false)::int AS waiting,
        COUNT(*) FILTER (WHERE granted = true)::int AS held
      FROM pg_locks
      GROUP BY locktype, mode
      ORDER BY waiting DESC, held DESC;
    `).then(res => res.rows),
    
    executor.query<{ database: string; waiting_locks: number; held_locks: number; total_locks: number }>(`
      SELECT
        a.datname AS database,
        COUNT(*) FILTER (WHERE l.granted = false)::int AS waiting_locks,
        COUNT(*) FILTER (WHERE l.granted = true)::int AS held_locks,
        COUNT(*)::int AS total_locks
      FROM pg_stat_activity a
      JOIN pg_locks l ON l.pid = a.pid
      GROUP BY a.datname
      ORDER BY waiting_locks DESC, total_locks DESC;
    `).then(res => res.rows),
    
    // Performance
    executor.query<{ relname: string; idx_scan: number | null; seq_scan: number | null; idx_usage: number | null }>(`
      SELECT relname,
            idx_scan,
            seq_scan,
            ROUND(100*idx_scan::numeric / NULLIF(idx_scan+seq_scan,0), 2) AS idx_usage
      FROM pg_stat_user_tables
      ORDER BY idx_usage ASC NULLS LAST
      LIMIT 10;
    `).then(res => res.rows.map(r => ({
      relname: r.relname,
      idx_scan: r.idx_scan,
      seq_scan: r.seq_scan,
      idx_usage: r.idx_usage === null ? null : Number(r.idx_usage),
    }))),
    
    executor.query<{
      schemaname: string;
      relname: string;
      seq_scan: number | null;
      idx_scan: number | null;
      idx_usage_percent: number | null;
      n_live_tup: number | null;
    }>(`
      SELECT
        schemaname,
        relname,
        seq_scan,
        idx_scan,
        ROUND(100.0 * idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0), 2) AS idx_usage_percent,
        n_live_tup
      FROM pg_stat_user_tables
      ORDER BY seq_scan DESC
      LIMIT 20;
    `).then(res => res.rows),
    
    executor.query<{ schemaname: string; relname: string; total_size: string; table_size: string; index_size: string }>(`
      SELECT
        schemaname,
        relname,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
        pg_size_pretty(pg_relation_size(relid)) AS table_size,
        pg_size_pretty(pg_indexes_size(relid)) AS index_size
      FROM pg_catalog.pg_statio_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `).then(res => res.rows),
    
    // Sessions
    executor.query<{
      pid: number;
      usename: string;
      datname: string;
      state: string | null;
      duration_sec: number;
      query: string | null;
      query_start: string | null;
      application_name: string | null;
    }>(`
      SELECT
        pid,
        usename,
        datname,
        state,
        EXTRACT(EPOCH FROM now() - query_start)::int AS duration_sec,
        query,
        TO_CHAR(query_start, 'YYYY-MM-DD"T"HH24:MI:SS') AS query_start,
        application_name
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
        AND query NOT ILIKE '%pg_stat_activity%'
        AND now() - query_start > make_interval(secs => $1)
      ORDER BY duration_sec DESC
      LIMIT 100;
    `, [minSec]).then(res => res.rows.map(r => {
      const item: {
        pid: number;
        user: string;
        db: string;
        state: string;
        durationSec: number;
        startedAt?: string;
        query?: string;
        app?: string;
      } = {
        pid: r.pid,
        user: r.usename,
        db: r.datname,
        state: r.state ?? "active",
        durationSec: r.duration_sec,
      };
      if (r.query_start != null) item.startedAt = r.query_start;
      if (r.query != null) item.query = r.query;
      if (r.application_name != null) item.app = r.application_name;
      return item;
    })),
    
    executor.query<{
      pid: number;
      usename: string | null;
      datname: string | null;
      state: string | null;
      wait_event_type: string | null;
      wait_event: string | null;
      duration: string;
      sample_query: string | null;
    }>(`
      SELECT
        pid,
        usename,
        datname,
        state,
        wait_event_type,
        wait_event,
        (now() - query_start)::text AS duration,
        LEFT(query, 200) AS sample_query
      FROM pg_stat_activity
      WHERE state <> 'idle'
      ORDER BY now() - query_start DESC
      LIMIT 20;
    `).then(res => res.rows),
    
    executor.query<{
      database: string;
      pid: number;
      user: string | null;
      state: string | null;
      idle_duration: string;
      current_query: string | null;
    }>(`
      SELECT
        datname AS database,
        pid,
        usename AS user,
        state,
        (now() - xact_start)::text AS idle_duration,
        query AS current_query
      FROM pg_stat_activity
      WHERE state = 'idle in transaction'
      ORDER BY now() - xact_start DESC
      LIMIT 10;
    `).then(res => res.rows),
    
    executor.query<{
      active_sessions: number;
      waiting_sessions: number;
      idle_sessions: number;
      total_sessions: number;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE state = 'active') AS active_sessions,
        COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting_sessions,
        COUNT(*) FILTER (WHERE state = 'idle') AS idle_sessions,
        COUNT(*) AS total_sessions
      FROM pg_stat_activity
      WHERE datname = current_database();
    `).then(res => res.rows[0] ?? null),
    
    executor.query<{
      database: string;
      xact_commit: number | null;
      xact_rollback: number | null;
      tps: number | null;
      rollback_pct: number | null;
      stats_reset: string | null;
    }>(`
      SELECT
        datname AS database,
        xact_commit,
        xact_rollback,
        ROUND((xact_commit + xact_rollback)::numeric / NULLIF(EXTRACT(EPOCH FROM (now() - stats_reset)), 0), 2) AS tps,
        ROUND((100.0 * xact_rollback / NULLIF(xact_commit + xact_rollback, 0)), 2) AS rollback_pct,
        TO_CHAR(stats_reset, 'YYYY-MM-DD HH24:MI:SS') AS stats_reset
      FROM pg_stat_database
      WHERE datname NOT IN ('template0', 'template1')
      ORDER BY tps DESC NULLS LAST;
    `).then(res => res.rows.map(r => ({
      database: r.database,
      xact_commit: r.xact_commit,
      xact_rollback: r.xact_rollback,
      tps: r.tps === null ? null : Number(r.tps),
      rollback_pct: r.rollback_pct === null ? null : Number(r.rollback_pct),
      stats_reset: r.stats_reset,
    }))),
    
    executor.query<{
      database: string;
      cache_hit_pct: number | null;
      blks_hit: number | null;
      blks_read: number | null;
    }>(`
      SELECT
        datname AS database,
        ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_pct,
        blks_hit,
        blks_read
      FROM pg_stat_database
      WHERE datname NOT IN ('template0', 'template1')
      ORDER BY cache_hit_pct DESC;
    `).then(res => res.rows.map(r => ({
      database: r.database,
      cache_hit_pct: r.cache_hit_pct === null ? null : Number(r.cache_hit_pct),
      blks_hit: r.blks_hit,
      blks_read: r.blks_read,
    }))),
    
    // Maintenance
    executor.query<{
      relname: string;
      n_live_tup: number | null;
      n_dead_tup: number | null;
      last_autovacuum: string | null;
      last_vacuum: string | null;
    }>(`
      SELECT relname,
            n_live_tup,
            n_dead_tup,
            TO_CHAR(last_autovacuum, 'YYYY-MM-DD"T"HH24:MI:SS') AS last_autovacuum,
            TO_CHAR(last_vacuum, 'YYYY-MM-DD"T"HH24:MI:SS') AS last_vacuum
      FROM pg_stat_user_tables
      ORDER BY n_dead_tup DESC NULLS LAST
      LIMIT 10;
    `).then(res => res.rows),
    
    executor.query<{
      schema: string;
      table: string;
      dead_percent: number | null;
      autovacuum_count: number | null;
      vacuum_count: number | null;
    }>(`
      SELECT
        schemaname                                   AS schema,
        relname                                      AS table,
        ROUND((n_dead_tup::numeric
              / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_percent,
        autovacuum_count,
        vacuum_count
      FROM pg_stat_user_tables
      ORDER BY dead_percent DESC NULLS LAST
      LIMIT 20;
    `).then(res => res.rows),
    
    // WAL / Checkpoint / I/O
    executor.query<{
      wal_records: number | null;
      wal_fpi: number | null;
      wal_bytes: number | null;
      wal_bytes_per_sec: number | null;
      stats_reset: string | null;
    }>(`
      SELECT 
        wal_records,
        wal_fpi,
        wal_bytes,
        ROUND(wal_bytes::numeric / NULLIF(EXTRACT(EPOCH FROM (now() - stats_reset)), 0), 2) AS wal_bytes_per_sec,
        TO_CHAR(stats_reset, 'YYYY-MM-DD"T"HH24:MI:SS') AS stats_reset
      FROM pg_stat_wal;
    `).then(res => res.rows[0] ? {
      wal_records: res.rows[0].wal_records,
      wal_fpi: res.rows[0].wal_fpi,
      wal_bytes: res.rows[0].wal_bytes !== null ? Number(res.rows[0].wal_bytes) : null,
      wal_bytes_per_sec: res.rows[0].wal_bytes_per_sec !== null ? Number(res.rows[0].wal_bytes_per_sec) : null,
      stats_reset: res.rows[0].stats_reset,
    } : null),
    
    executor.query<{
      num_timed: number | null;
      num_requested: number | null;
      num_done: number | null;
      write_time: number | null;
      sync_time: number | null;
      buffers_written: number | null;
      slru_written: number | null;
      stats_reset: string | null;
    }>(`
      SELECT
        num_timed,
        num_requested,
        num_done,
        write_time,
        sync_time,
        buffers_written,
        slru_written,
        TO_CHAR(stats_reset, 'YYYY-MM-DD"T"HH24:MI:SS') AS stats_reset
      FROM pg_stat_checkpointer;
    `).then(res => res.rows[0] ? {
      num_timed: res.rows[0].num_timed,
      num_requested: res.rows[0].num_requested,
      num_done: res.rows[0].num_done,
      write_time: res.rows[0].write_time !== null ? Number(res.rows[0].write_time) : null,
      sync_time: res.rows[0].sync_time !== null ? Number(res.rows[0].sync_time) : null,
      buffers_written: res.rows[0].buffers_written !== null ? Number(res.rows[0].buffers_written) : null,
      slru_written: res.rows[0].slru_written !== null ? Number(res.rows[0].slru_written) : null,
      stats_reset: res.rows[0].stats_reset,
    } : null),
    
    executor.query<{ datname: string; temp_files: number | null; temp_bytes: number | null }>(`
      SELECT datname,
            temp_files,
            temp_bytes
      FROM pg_stat_database
      ORDER BY temp_bytes DESC;
    `).then(res => res.rows.map(r => ({
      datname: r.datname,
      temp_files: r.temp_files,
      temp_bytes: typeof r.temp_bytes === 'string' ? Number(r.temp_bytes) : r.temp_bytes,
    }))),
    
    executor.query<{ datname: string; size: string }>(`
      SELECT datname,
            pg_size_pretty(pg_database_size(datname)) AS size
      FROM pg_database
      ORDER BY pg_database_size(datname) DESC;
    `).then(res => res.rows),
  ]);

  const overview = {
    connectionsByState: overviewRes,
    cacheHitPercent: cacheHitPercentRes,
  };

  return {
    overview,
    connectionUsage: connectionUsageRes,
    deadlocks: deadlocksRes,
    locks: locksRes,
    lockSummary: lockSummaryRes,
    blockedSessions: blockedSessionsRes,
    waitByLockMode: waitByLockModeRes,
    lockOverviewPerDb: lockOverviewPerDbRes,
    indexUsage: indexUsageRes,
    seqVsIdxScans: seqVsIdxScansRes,
    tableSizes: tableSizesRes,
    longRunning: longRunningRes,
    waitEvents: waitEventsRes,
    oldestIdleTransaction: oldestIdleTransactionRes,
    activeWaitingSessions: activeWaitingSessionsRes,
    tpsRollbackRate: tpsRollbackRateRes,
    perDbCacheHit: perDbCacheHitRes,
    autoVac: autoVacRes,
    deadTuplesAutovacuum: deadTuplesAutovacuumRes,
    walThroughput: walThroughputRes,
    checkpoints: checkpointsRes,
    tempFiles: tempFilesRes,
    dbSizes: dbSizesRes,
  };
}

