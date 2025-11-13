import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { q, pool, getPoolFromConfig } from "./db";
import { analyzeProblems, type ProblemAnalyzerInput } from "./analyzer/problemAnalyzer";
import { saveProblems, type ProblemContext } from "./repositories/problems";
import { startProblemScheduler, runProblemScan } from "./repositories/scheduler";

import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("Loaded ENV:", {
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGDATABASE: process.env.PGDATABASE,
});

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Middleware để extract connection config từ headers
interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

function getConnectionConfigFromHeaders(req: express.Request): ConnectionConfig | null {
  const host = req.headers["x-db-host"] as string | undefined;
  const port = req.headers["x-db-port"] as string | undefined;
  const user = req.headers["x-db-user"] as string | undefined;
  const password = req.headers["x-db-password"] as string | undefined;
  const database = req.headers["x-db-database"] as string | undefined;

  // Nếu có ít nhất một header, coi như có config
  if (host || port || user || password || database) {
    const config: ConnectionConfig = {};
    
    if (host) config.host = host;
    if (port) config.port = Number(port);
    if (user) config.user = user;
    if (password) config.password = password;
    if (database) config.database = database;
    
    return config;
  }

  return null;
}

// Helper để lấy pool từ request (tự động extract config từ headers)
function getPoolFromRequest(req: express.Request) {
  const config = getConnectionConfigFromHeaders(req);
  return config ? getPoolFromConfig(config) : pool;
}

// Helper để extract ProblemContext từ request
function getProblemContextFromRequest(req: express.Request): ProblemContext {
  const config = getConnectionConfigFromHeaders(req);
  
  // Lấy instance_label từ header hoặc tạo từ config
  const instanceLabelHeader = req.headers["x-instance-label"] as string | undefined;
  
  // Tạo connection_host từ config
  let connectionHost: string | undefined;
  if (config?.host) {
    const port = config.port || process.env.PGPORT || "5432";
    connectionHost = `${config.host}:${port}`;
  } else if (process.env.PGHOST) {
    const port = process.env.PGPORT || "5432";
    connectionHost = `${process.env.PGHOST}:${port}`;
  }
  
  // Lấy database_name từ config hoặc env
  const databaseName = config?.database || process.env.PGDATABASE || undefined;
  
  // Tạo instanceLabel: ưu tiên header, nếu không có thì tạo từ connectionHost + databaseName
  const instanceLabel = instanceLabelHeader || (connectionHost && databaseName 
    ? `${databaseName} (${connectionHost})` 
    : undefined);
  
  // Build object với conditional properties để phù hợp với exactOptionalPropertyTypes
  const context: ProblemContext = {};
  if (instanceLabel !== undefined) {
    context.instanceLabel = instanceLabel;
  }
  if (connectionHost !== undefined) {
    context.connectionHost = connectionHost;
  }
  if (databaseName !== undefined) {
    context.databaseName = databaseName;
  }
  
  return context;
}

// ========================
// 1️⃣ Health Check API
// ========================
app.get("/api/health", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<{ now: string }>("SELECT now()", undefined, poolToUse);
    res.json({ ok: true, now: rows[0]?.now ?? null });
  } catch (e: any) {
    console.error("health check error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========================
// 1️⃣.b Default Connection Info API
// ========================
app.get("/api/default-connection", (_req, res) => {
  try {
    // Trả về thông tin connection từ .env (không trả về password)
    const defaultConnection = {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      database: process.env.PGDATABASE || "postgres",
      // Không trả về password vì bảo mật
    };

    // Chỉ trả về nếu có đủ thông tin
    if (defaultConnection.host && defaultConnection.user && defaultConnection.database) {
      res.json({ 
        exists: true, 
        connection: defaultConnection,
        label: `${defaultConnection.database} (${defaultConnection.host}:${defaultConnection.port})`
      });
    } else {
      res.json({ exists: false });
    }
  } catch (e: any) {
    console.error("default-connection error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 1️⃣.c List All Databases API
// ========================
app.get("/api/databases", async (_req, res) => {
  try {
    // Kết nối với PostgreSQL để lấy danh sách databases
    // Sử dụng database 'postgres' để query (vì không thể kết nối với database đang list)
    const rows = await q<{ datname: string }>(
      `SELECT datname 
       FROM pg_database 
       WHERE datistemplate = false 
       ORDER BY datname;`,
      undefined,
      pool
    );
    
    // Trả về danh sách databases kèm thông tin connection từ .env
    const defaultConnection = {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
    };
    
    const databases = rows.map(r => ({
      name: r.datname,
      host: defaultConnection.host,
      port: defaultConnection.port,
      user: defaultConnection.user,
      label: `${r.datname} (${defaultConnection.host}:${defaultConnection.port})`,
    }));
    
    res.json({ databases });
  } catch (e: any) {
    console.error("databases list error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 2️⃣ /api/overview
// ========================
interface ConnRow {
  state: string | null;
  count: number;
}

interface CacheRow {
  hit: number | null;
}

app.get("/api/overview", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);

    // Đếm connections theo state
    const conns = await q<ConnRow>(`
      SELECT COALESCE(state, 'unknown') AS state, COUNT(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY COALESCE(state, 'unknown')
      ORDER BY count DESC;
    `, undefined, poolToUse);

    // 2) cache hit % (lấy theo database hiện tại)
    const cache = await q<{ hit: number | null }>(`
      SELECT CASE
               WHEN (SUM(blks_hit) + SUM(blks_read)) = 0 THEN 100.0
               ELSE ROUND(100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit) + SUM(blks_read),0), 1)
             END AS hit
      FROM pg_stat_database
      WHERE datname = current_database();
    `, undefined, poolToUse);

    res.json({
      connectionsByState: conns.map((r: ConnRow) => ({
        state: r.state ?? "unknown",
        count: r.count,
      })),
      cacheHitPercent: Number(cache[0]?.hit ?? 0),
    });
  } catch (e: any) {
    console.error("overview error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 3️⃣ /api/long-running
// ========================
interface LongRunningRow {
  pid: number;
  usename: string;
  datname: string;
  state: string | null;
  duration_sec: number;
  query: string | null;
  query_start: string | null;
  application_name: string | null;
}

app.get("/api/long-running", async (req, res) => {
  const minSec = Math.max(1, Number(req.query.minSec ?? 60));

  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<LongRunningRow>(
      `
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
      `,
      [minSec],
      poolToUse
    );

    const data = rows.map((r: LongRunningRow) => {
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
    });

    res.json(data);
  } catch (e: any) {
    console.error("overview error:", e); // 👈 thêm dòng này
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 4️⃣ Metrics Endpoints
// ========================
// --1. Deadlocks (Bế tắc giao dịch)
interface DeadlocksRow {
  datname: string;
  deadlocks: number;
}

app.get("/api/metrics/deadlocks", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<DeadlocksRow>(
      `SELECT datname, deadlocks::int AS deadlocks
       FROM pg_stat_database
       ORDER BY deadlocks DESC;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("deadlocks error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --2. Locks hiện tại (các khoá đang giữ)
interface LocksRow {
  mode: string;
  count: number;
}

app.get("/api/metrics/locks", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<LocksRow>(
      `SELECT mode, COUNT(*)::int AS count
       FROM pg_locks
       GROUP BY mode
       ORDER BY count DESC;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("locks error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --2b. Lock Summary (Granted vs Waiting)
interface LockSummaryRow {
  mode: string;
  granted: number;
  waiting: number;
}

app.get("/api/metrics/lock-summary", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<LockSummaryRow>(
      `SELECT
         l.mode,
         SUM(CASE WHEN l.granted THEN 1 ELSE 0 END)::int AS granted,
         SUM(CASE WHEN NOT l.granted THEN 1 ELSE 0 END)::int AS waiting
       FROM pg_locks AS l
       GROUP BY l.mode
       ORDER BY waiting DESC, granted DESC, mode;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("lock-summary error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --3. Autovacuum & Dead Tuples
interface AutoVacRow {
  relname: string;
  n_live_tup: number | null;
  n_dead_tup: number | null;
  last_autovacuum: string | null;
  last_vacuum: string | null;
}

app.get("/api/metrics/autovacuum", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<AutoVacRow>(
      `SELECT relname,
              n_live_tup,
              n_dead_tup,
              TO_CHAR(last_autovacuum, 'YYYY-MM-DD"T"HH24:MI:SS') AS last_autovacuum,
              TO_CHAR(last_vacuum, 'YYYY-MM-DD"T"HH24:MI:SS') AS last_vacuum
       FROM pg_stat_user_tables
       ORDER BY n_dead_tup DESC NULLS LAST
       LIMIT 10;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("autovacuum error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --4. Index Usage (tỷ lệ sử dụng index)
interface IndexUsageRow {
  relname: string;
  idx_scan: number | null;
  seq_scan: number | null;
  idx_usage: string | number | null;
}

app.get("/api/metrics/index-usage", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<IndexUsageRow>(
      `SELECT relname,
              idx_scan,
              seq_scan,
              ROUND(100*idx_scan::numeric / NULLIF(idx_scan+seq_scan,0), 2) AS idx_usage
       FROM pg_stat_user_tables
       ORDER BY idx_usage ASC NULLS LAST
       LIMIT 10;`,
      undefined,
      poolToUse
    );
    // Normalize idx_usage to number when possible
    const data = rows.map(r => ({
      relname: r.relname,
      idx_scan: r.idx_scan,
      seq_scan: r.seq_scan,
      idx_usage: r.idx_usage === null ? null : Number(r.idx_usage)
    }));
    res.json(data);
  } catch (e: any) {
    console.error("index-usage error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --5. Temp Files / Sort Spill
interface TempFilesRow {
  datname: string;
  temp_files: number | null;
  temp_bytes: string | number | null;
}

app.get("/api/metrics/temp-files", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<TempFilesRow>(
      `SELECT datname,
              temp_files,
              temp_bytes
       FROM pg_stat_database
       ORDER BY temp_bytes DESC;`,
      undefined,
      poolToUse
    );
    // temp_bytes returned as string in node-pg for bigints; coerce to number if safe
    const data = rows.map(r => ({
      datname: r.datname,
      temp_files: r.temp_files,
      temp_bytes: typeof r.temp_bytes === 'string' ? Number(r.temp_bytes) : r.temp_bytes
    }));
    res.json(data);
  } catch (e: any) {
    console.error("temp-files error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --7. Database Size (tăng trưởng)
interface DbSizeRow {
  datname: string;
  size: string;
}

app.get("/api/metrics/db-sizes", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<DbSizeRow>(
      `SELECT datname,
              pg_size_pretty(pg_database_size(datname)) AS size
       FROM pg_database
       ORDER BY pg_database_size(datname) DESC;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("db-sizes error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 4️⃣.b Additional Metrics (from user queries)
// ========================

// --11b. Top Tables with Dead Tuples & Vacuum Times
// --11. Dead Tuples & Autovacuum Count (combined)
interface DeadTuplesAutovacuumRow {
  schema: string;
  table: string;
  dead_percent: number | null;
  autovacuum_count: number | null;
  vacuum_count: number | null;
}

app.get("/api/metrics/dead-tuples-autovacuum", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<DeadTuplesAutovacuumRow>(
      `SELECT
         schemaname                                   AS schema,
         relname                                      AS table,
         ROUND((n_dead_tup::numeric
               / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_percent,
         autovacuum_count,
         vacuum_count
       FROM pg_stat_user_tables              -- chỉ bảng của user trong DB hiện tại
       ORDER BY dead_percent DESC NULLS LAST
       LIMIT 20;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("dead-tuples-autovacuum error:", e);
    res.status(500).json({ error: e.message });
  }
});


// --12. Connection Usage (current vs max)
interface ConnectionUsageRow {
  current_connections: number;
  max_connections: number;
  used_percent: number | null;
}

app.get("/api/metrics/connection-usage", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<ConnectionUsageRow>(
      `SELECT
         current_connections,
         max_connections,
         ROUND(100.0 * current_connections / max_connections, 2) AS used_percent
       FROM (
         SELECT
           COUNT(*) AS current_connections,
           (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
         FROM pg_stat_activity
       ) AS s;`,
      undefined,
      poolToUse
    );
    res.json(rows?.[0] ?? {});
  } catch (e: any) {
    console.error("connection-usage error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --13. Long Running Sessions with Wait Events
interface WaitEventRow {
  pid: number;
  usename: string | null;
  datname: string | null;
  state: string | null;
  wait_event_type: string | null;
  wait_event: string | null;
  duration: string;
  sample_query: string | null;
}

app.get("/api/metrics/wait-events", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<WaitEventRow>(
      `SELECT
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
       LIMIT 20;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("wait-events error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --14. Blocked Sessions (locked)
interface BlockedSessionsRow {
  blocked_pid: number;
  blocked_user: string | null;
  blocked_query: string | null;
  blocking_pid: number;
  blocking_user: string | null;
  blocking_query: string | null;
  blocked_state: string | null;
  blocking_state: string | null;
  blocked_duration: string;
}

app.get("/api/metrics/blocked-sessions", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<BlockedSessionsRow>(
      `SELECT
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
       LIMIT 20;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("blocked-sessions error:", e);
    res.status(500).json({ error: e.message });
  }
});


// --15. Sequential vs Index Scans
interface SeqVsIdxScanRow {
  schemaname: string;
  relname: string;
  seq_scan: number | null;
  idx_scan: number | null;
  idx_usage_percent: number | null;
  n_live_tup: number | null;
}

app.get("/api/metrics/seq-vs-index-scans", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<SeqVsIdxScanRow>(
      `SELECT
         schemaname,
         relname,
         seq_scan,
         idx_scan,
         ROUND(100.0 * idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0), 2) AS idx_usage_percent,
         n_live_tup
       FROM pg_stat_user_tables
       ORDER BY seq_scan DESC
       LIMIT 20;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("seq-vs-index-scans error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --16. Largest Table/Index Sizes
interface TableSizeRow {
  schemaname: string;
  relname: string;
  total_size: string;
  table_size: string;
  index_size: string;
}

app.get("/api/metrics/table-sizes", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<TableSizeRow>(
      `SELECT
         schemaname,
         relname,
         pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
         pg_size_pretty(pg_relation_size(relid)) AS table_size,
         pg_size_pretty(pg_indexes_size(relid)) AS index_size
       FROM pg_catalog.pg_statio_user_tables
       ORDER BY pg_total_relation_size(relid) DESC
       LIMIT 10;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("table-sizes error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --17. Oldest Idle-in-Transaction
interface OldestIdleTransactionRow {
  database: string;
  pid: number;
  user: string | null;
  state: string | null;
  idle_duration: string;
  current_query: string | null;
}

app.get("/api/metrics/oldest-idle-transaction", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<OldestIdleTransactionRow>(
      `SELECT
         datname AS database,
         pid,
         usename AS user,
         state,
         (now() - xact_start)::text AS idle_duration,
         query AS current_query
       FROM pg_stat_activity
       WHERE state = 'idle in transaction'
       ORDER BY now() - xact_start DESC
       LIMIT 10;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("oldest-idle-transaction error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --18. TPS & Rollback Rate theo Database
interface TpsRollbackRateRow {
  database: string;
  xact_commit: number | null;
  xact_rollback: number | null;
  tps: number | null;
  rollback_pct: number | null;
  stats_reset: string | null;
}

app.get("/api/metrics/tps-rollback-rate", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<TpsRollbackRateRow>(
      `SELECT
         datname AS database,
         xact_commit,
         xact_rollback,
         ROUND((xact_commit + xact_rollback)::numeric / NULLIF(EXTRACT(EPOCH FROM (now() - stats_reset)), 0), 2) AS tps,
         ROUND((100.0 * xact_rollback / NULLIF(xact_commit + xact_rollback, 0)), 2) AS rollback_pct,
         TO_CHAR(stats_reset, 'YYYY-MM-DD HH24:MI:SS') AS stats_reset
       FROM pg_stat_database
       WHERE datname NOT IN ('template0', 'template1')
       ORDER BY tps DESC NULLS LAST;`,
      undefined,
      poolToUse
    );
    // Normalize numeric values to number when possible
    const data = rows.map(r => ({
      database: r.database,
      xact_commit: r.xact_commit,
      xact_rollback: r.xact_rollback,
      tps: r.tps === null ? null : Number(r.tps),
      rollback_pct: r.rollback_pct === null ? null : Number(r.rollback_pct),
      stats_reset: r.stats_reset,
    }));
    res.json(data);
  } catch (e: any) {
    console.error("tps-rollback-rate error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --19. Active vs Waiting Sessions
interface ActiveWaitingSessionsRow {
  active_sessions: number;
  waiting_sessions: number;
  idle_sessions: number;
  total_sessions: number;
}

app.get("/api/metrics/active-waiting-sessions", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<ActiveWaitingSessionsRow>(
      `SELECT
         COUNT(*) FILTER (WHERE state = 'active') AS active_sessions,
         COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting_sessions,
         COUNT(*) FILTER (WHERE state = 'idle') AS idle_sessions,
         COUNT(*) AS total_sessions
       FROM pg_stat_activity
       WHERE datname = current_database();`,
      undefined,
      poolToUse
    );
    res.json(rows?.[0] ?? {});
  } catch (e: any) {
    console.error("active-waiting-sessions error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --20. Per-DB Cache Hit %
interface PerDbCacheHitRow {
  database: string;
  cache_hit_pct: number | null;
  blks_hit: number | null;
  blks_read: number | null;
}

app.get("/api/metrics/per-db-cache-hit", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<PerDbCacheHitRow>(
      `SELECT
         datname AS database,
         ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_pct,
         blks_hit,
         blks_read
       FROM pg_stat_database
       WHERE datname NOT IN ('template0', 'template1')
       ORDER BY cache_hit_pct DESC;`,
      undefined,
      poolToUse
    );
    // Normalize numeric values to number when possible
    const data = rows.map(r => ({
      database: r.database,
      cache_hit_pct: r.cache_hit_pct === null ? null : Number(r.cache_hit_pct),
      blks_hit: r.blks_hit,
      blks_read: r.blks_read,
    }));
    res.json(data);
  } catch (e: any) {
    console.error("per-db-cache-hit error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --21. Wait by Lock Mode
interface WaitByLockModeRow {
  locktype: string;
  mode: string;
  waiting: number;
  held: number;
}

app.get("/api/metrics/wait-by-lock-mode", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<WaitByLockModeRow>(
      `SELECT
         locktype,
         mode,
         COUNT(*) FILTER (WHERE granted = false)::int AS waiting,
         COUNT(*) FILTER (WHERE granted = true)::int AS held
       FROM pg_locks
       GROUP BY locktype, mode
       ORDER BY waiting DESC, held DESC;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("wait-by-lock-mode error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --22. Lock Overview per Database
interface LockOverviewPerDbRow {
  database: string;
  waiting_locks: number;
  held_locks: number;
  total_locks: number;
}

app.get("/api/metrics/lock-overview-per-db", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<LockOverviewPerDbRow>(
      `SELECT
         a.datname AS database,
         COUNT(*) FILTER (WHERE l.granted = false)::int AS waiting_locks,
         COUNT(*) FILTER (WHERE l.granted = true)::int AS held_locks,
         COUNT(*)::int AS total_locks
       FROM pg_stat_activity a
       JOIN pg_locks l ON l.pid = a.pid
       GROUP BY a.datname
       ORDER BY waiting_locks DESC, total_locks DESC;`,
      undefined,
      poolToUse
    );
    res.json(rows);
  } catch (e: any) {
    console.error("lock-overview-per-db error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 4️⃣.c WAL / Checkpoint / I/O Metrics
// ========================

// --23. WAL Throughput (PG13+)
interface WALThroughputRow {
  wal_records: number | null;
  wal_fpi: number | null;
  wal_bytes: number | null;
  wal_bytes_per_sec: number | null;
  stats_reset: string | null;
}

app.get("/api/metrics/wal-throughput", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<WALThroughputRow>(
      `SELECT 
         wal_records,
         wal_fpi,
         wal_bytes,
         ROUND(wal_bytes::numeric / NULLIF(EXTRACT(EPOCH FROM (now() - stats_reset)), 0), 2) AS wal_bytes_per_sec,
         TO_CHAR(stats_reset, 'YYYY-MM-DD"T"HH24:MI:SS') AS stats_reset
       FROM pg_stat_wal;`,
      undefined,
      poolToUse
    );
    // Normalize numeric values
    const data = rows[0] ? {
      wal_records: rows[0].wal_records,
      wal_fpi: rows[0].wal_fpi,
      wal_bytes: rows[0].wal_bytes !== null ? Number(rows[0].wal_bytes) : null,
      wal_bytes_per_sec: rows[0].wal_bytes_per_sec !== null ? Number(rows[0].wal_bytes_per_sec) : null,
      stats_reset: rows[0].stats_reset,
    } : null;
    res.json(data);
  } catch (e: any) {
    console.error("wal-throughput error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --24. Checkpoints & bgwriter
interface CheckpointsRow {
  num_timed: number | null;
  num_requested: number | null;
  num_done: number | null;
  write_time: number | null;
  sync_time: number | null;
  buffers_written: number | null;
  slru_written: number | null;
  stats_reset: string | null;
}

app.get("/api/metrics/checkpoints", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const rows = await q<CheckpointsRow>(
      `SELECT
         num_timed,
         num_requested,
         num_done,
         write_time,
         sync_time,
         buffers_written,
         slru_written,
         TO_CHAR(stats_reset, 'YYYY-MM-DD"T"HH24:MI:SS') AS stats_reset
       FROM pg_stat_checkpointer;`,
      undefined,
      poolToUse
    );
    // Normalize numeric values
    const data = rows[0] ? {
      num_timed: rows[0].num_timed,
      num_requested: rows[0].num_requested,
      num_done: rows[0].num_done,
      write_time: rows[0].write_time !== null ? Number(rows[0].write_time) : null,
      sync_time: rows[0].sync_time !== null ? Number(rows[0].sync_time) : null,
      buffers_written: rows[0].buffers_written !== null ? Number(rows[0].buffers_written) : null,
      slru_written: rows[0].slru_written !== null ? Number(rows[0].slru_written) : null,
      stats_reset: rows[0].stats_reset,
    } : null;
    res.json(data);
  } catch (e: any) {
    console.error("checkpoints error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ========================
// 25. Problem Analyzer API
// ========================
app.get("/api/problems", async (req, res) => {
  try {
    const poolToUse = getPoolFromRequest(req);
    const minSec = Math.max(1, Number(req.query.minSec ?? 60));

    console.log("[problems] Starting to fetch all metrics...");

    // Query tất cả metrics cần thiết
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
      q<{ state: string; count: number }>(`
        SELECT COALESCE(state, 'unknown') AS state, COUNT(*)::int AS count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY COALESCE(state, 'unknown')
        ORDER BY count DESC;
      `, undefined, poolToUse),
      // Overview - Cache Hit Percent
      q<{ hit: number | null }>(`
        SELECT CASE
                 WHEN (SUM(blks_hit) + SUM(blks_read)) = 0 THEN 100.0
                 ELSE ROUND(100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit) + SUM(blks_read),0), 1)
               END AS hit
        FROM pg_stat_database
        WHERE datname = current_database();
      `, undefined, poolToUse).then(rows => Number(rows[0]?.hit ?? 0)),
      
      // Connection Usage
      q<{ current_connections: number; max_connections: number; used_percent: number }>(`
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
      `, undefined, poolToUse).then(rows => rows[0] ?? null),
      
      // Deadlocks & Locks
      q<{ datname: string; deadlocks: number }>(`
        SELECT datname, deadlocks::int AS deadlocks
        FROM pg_stat_database
        ORDER BY deadlocks DESC;
      `, undefined, poolToUse),
      q<{ mode: string; count: number }>(`
        SELECT mode, COUNT(*)::int AS count
        FROM pg_locks
        GROUP BY mode
        ORDER BY count DESC;
      `, undefined, poolToUse),
      q<{ mode: string; granted: number; waiting: number }>(`
        SELECT
          l.mode,
          SUM(CASE WHEN l.granted THEN 1 ELSE 0 END)::int AS granted,
          SUM(CASE WHEN NOT l.granted THEN 1 ELSE 0 END)::int AS waiting
        FROM pg_locks AS l
        GROUP BY l.mode
        ORDER BY waiting DESC, granted DESC, mode;
      `, undefined, poolToUse),
      q<{
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
      `, undefined, poolToUse),
      q<{ locktype: string; mode: string; waiting: number; held: number }>(`
        SELECT
          locktype,
          mode,
          COUNT(*) FILTER (WHERE granted = false)::int AS waiting,
          COUNT(*) FILTER (WHERE granted = true)::int AS held
        FROM pg_locks
        GROUP BY locktype, mode
        ORDER BY waiting DESC, held DESC;
      `, undefined, poolToUse),
      q<{ database: string; waiting_locks: number; held_locks: number; total_locks: number }>(`
        SELECT
          a.datname AS database,
          COUNT(*) FILTER (WHERE l.granted = false)::int AS waiting_locks,
          COUNT(*) FILTER (WHERE l.granted = true)::int AS held_locks,
          COUNT(*)::int AS total_locks
        FROM pg_stat_activity a
        JOIN pg_locks l ON l.pid = a.pid
        GROUP BY a.datname
        ORDER BY waiting_locks DESC, total_locks DESC;
      `, undefined, poolToUse),
      
      // Performance
      q<{ relname: string; idx_scan: number | null; seq_scan: number | null; idx_usage: number | null }>(`
        SELECT relname,
              idx_scan,
              seq_scan,
              ROUND(100*idx_scan::numeric / NULLIF(idx_scan+seq_scan,0), 2) AS idx_usage
        FROM pg_stat_user_tables
        ORDER BY idx_usage ASC NULLS LAST
        LIMIT 10;
      `, undefined, poolToUse).then(rows => rows.map(r => ({
        relname: r.relname,
        idx_scan: r.idx_scan,
        seq_scan: r.seq_scan,
        idx_usage: r.idx_usage === null ? null : Number(r.idx_usage),
      }))),
      q<{
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
      `, undefined, poolToUse),
      q<{ schemaname: string; relname: string; total_size: string; table_size: string; index_size: string }>(`
        SELECT
          schemaname,
          relname,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          pg_size_pretty(pg_relation_size(relid)) AS table_size,
          pg_size_pretty(pg_indexes_size(relid)) AS index_size
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 10;
      `, undefined, poolToUse),
      
      // Sessions
      q<{
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
      `, [minSec], poolToUse).then(rows => rows.map(r => {
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
      q<{
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
      `, undefined, poolToUse),
      q<{
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
      `, undefined, poolToUse),
      q<{
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
      `, undefined, poolToUse).then(rows => rows[0] ?? null),
      q<{
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
      `, undefined, poolToUse).then(rows => rows.map(r => ({
        database: r.database,
        xact_commit: r.xact_commit,
        xact_rollback: r.xact_rollback,
        tps: r.tps === null ? null : Number(r.tps),
        rollback_pct: r.rollback_pct === null ? null : Number(r.rollback_pct),
        stats_reset: r.stats_reset,
      }))),
      q<{
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
      `, undefined, poolToUse).then(rows => rows.map(r => ({
        database: r.database,
        cache_hit_pct: r.cache_hit_pct === null ? null : Number(r.cache_hit_pct),
        blks_hit: r.blks_hit,
        blks_read: r.blks_read,
      }))),
      
      // Maintenance
      q<{
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
      `, undefined, poolToUse),
      q<{
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
      `, undefined, poolToUse),
      
      // WAL / Checkpoint / I/O
      q<{
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
      `, undefined, poolToUse).then(rows => rows[0] ? {
        wal_records: rows[0].wal_records,
        wal_fpi: rows[0].wal_fpi,
        wal_bytes: rows[0].wal_bytes !== null ? Number(rows[0].wal_bytes) : null,
        wal_bytes_per_sec: rows[0].wal_bytes_per_sec !== null ? Number(rows[0].wal_bytes_per_sec) : null,
        stats_reset: rows[0].stats_reset,
      } : null),
      q<{
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
      `, undefined, poolToUse).then(rows => rows[0] ? {
        num_timed: rows[0].num_timed,
        num_requested: rows[0].num_requested,
        num_done: rows[0].num_done,
        write_time: rows[0].write_time !== null ? Number(rows[0].write_time) : null,
        sync_time: rows[0].sync_time !== null ? Number(rows[0].sync_time) : null,
        buffers_written: rows[0].buffers_written !== null ? Number(rows[0].buffers_written) : null,
        slru_written: rows[0].slru_written !== null ? Number(rows[0].slru_written) : null,
        stats_reset: rows[0].stats_reset,
      } : null),
      q<{ datname: string; temp_files: number | null; temp_bytes: number | null }>(`
        SELECT datname,
              temp_files,
              temp_bytes
        FROM pg_stat_database
        ORDER BY temp_bytes DESC;
      `, undefined, poolToUse).then(rows => rows.map(r => ({
        datname: r.datname,
        temp_files: r.temp_files,
        temp_bytes: typeof r.temp_bytes === 'string' ? Number(r.temp_bytes) : r.temp_bytes,
      }))),
      q<{ datname: string; size: string }>(`
        SELECT datname,
              pg_size_pretty(pg_database_size(datname)) AS size
        FROM pg_database
        ORDER BY pg_database_size(datname) DESC;
      `, undefined, poolToUse),
    ]);

    console.log("[problems] All queries completed successfully");

    // Tính cache hit percent từ query riêng
    const overview = {
      connectionsByState: overviewRes,
      cacheHitPercent: cacheHitPercentRes,
    };

    // Chuẩn bị input cho Problem Analyzer
    const analyzerInput: ProblemAnalyzerInput = {
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

    // Chạy Problem Analyzer
    console.log("[problems] ========================================");
    console.log("[problems] Running Problem Analyzer...");
    const problems = analyzeProblems(analyzerInput);
    console.log(`[problems] Found ${problems.length} problems`);
    console.log(`[problems] Problems:`, problems.map(p => p.id).join(", "));

    // Lưu problems vào database (sử dụng default pool cho monitoring database)
    console.log(`[problems] Checking if should save: problems.length = ${problems.length}`);
    if (problems.length > 0) {
      console.log(`[problems] ✅ Will attempt to save ${problems.length} problems`);
      try {
        const problemContext = getProblemContextFromRequest(req);
        console.log("[problems] Context extracted:", JSON.stringify(problemContext, null, 2));
        console.log(`[problems] About to call saveProblems() with ${problems.length} problems`);
        
        await saveProblems(pool, problems, problemContext);
        console.log(`[problems] ✅✅✅ Successfully saved ${problems.length} problems ✅✅✅`);
      } catch (saveError: any) {
        // Log lỗi chi tiết nhưng không fail request, vì problems đã được detect và trả về
        console.error("[problems] ❌ Error saving problems to database:");
        console.error("[problems] Error message:", saveError.message);
        console.error("[problems] Error code:", saveError.code);
        console.error("[problems] Error detail:", saveError.detail);
        console.error("[problems] Error hint:", saveError.hint);
        console.error("[problems] Error stack:", saveError.stack);
        
        // Kiểm tra các lỗi thường gặp
        if (saveError.code === '42P01') {
          console.error("[problems] ⚠️  Schema 'monitoring' or table 'problems' does not exist!");
          console.error("[problems] ⚠️  Please run SCHEMA_PROPOSAL.sql to create the schema");
        } else if (saveError.code === '42501') {
          console.error("[problems] ⚠️  Permission denied! User does not have access to schema 'monitoring'");
          console.error("[problems] ⚠️  Please grant permissions: GRANT USAGE ON SCHEMA monitoring TO your_user;");
        } else if (saveError.code === '23505') {
          console.error("[problems] ⚠️  Unique constraint violation (this should be handled by ON CONFLICT)");
        }
      }
    } else {
      console.log("[problems] ⚠️  No problems detected, skipping save");
    }

    console.log("[problems] ========================================");
    res.json(problems);
  } catch (e: any) {
    console.error("problems error:", e);
    console.error("Stack:", e.stack);
    res.status(500).json({ 
      error: e.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    });
  }
});

// ========================
// 26. Get Stored Problems API (để kiểm tra problems đã lưu)
// ========================
app.get("/api/problems/stored", async (req, res) => {
  try {
    // Sử dụng default pool để query từ monitoring database
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const status = (req.query.status as string) || "open";
    
    const problems = await q<{
      id: number;
      problem_id: string;
      priority: string;
      category: string;
      path: string;
      title: string;
      instance_label: string | null;
      connection_host: string | null;
      database_name: string | null;
      detected_at: string;
      first_seen_at: string;
      created_at: string;
      updated_at: string;
    }>(`
      SELECT 
        id,
        problem_id,
        priority,
        category,
        path,
        title,
        instance_label,
        connection_host,
        database_name,
        detected_at,
        first_seen_at,
        created_at,
        updated_at
      FROM monitoring.problems
      WHERE status = $1
      ORDER BY detected_at DESC
      LIMIT $2
    `, [status, limit], pool);

    const stats = await q<{
      total: string;
      open: string;
      resolved: string;
      suppressed: string;
    }>(`
      SELECT 
        COUNT(*)::text as total,
        COUNT(*) FILTER (WHERE status = 'open')::text as open,
        COUNT(*) FILTER (WHERE status = 'resolved')::text as resolved,
        COUNT(*) FILTER (WHERE status = 'suppressed')::text as suppressed
      FROM monitoring.problems
    `, [], pool);

    res.json({
      problems,
      stats: {
        total: Number(stats[0]?.total ?? 0),
        open: Number(stats[0]?.open ?? 0),
        resolved: Number(stats[0]?.resolved ?? 0),
        suppressed: Number(stats[0]?.suppressed ?? 0),
      },
    });
  } catch (e: any) {
    console.error("stored problems error:", e);
    res.status(500).json({ 
      error: e.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    });
  }
});

// ========================
// 27. Manual Auto-Resolve API (để test hoặc trigger thủ công)
// ========================
app.post("/api/problems/auto-resolve", async (req, res) => {
  try {
    const staleMinutes = Number(req.body.minutes ?? 30);
    
    const result = await q<{
      resolved_count: number;
      resolved_ids: number[];
    }>(`
      SELECT * FROM monitoring.auto_resolve_stale_problems($1)
    `, [staleMinutes], pool);
    
    const count = result[0]?.resolved_count ?? 0;
    const ids = result[0]?.resolved_ids ?? [];
    
    res.json({
      success: true,
      resolved_count: count,
      resolved_ids: ids,
      message: count > 0 
        ? `Resolved ${count} stale problems (older than ${staleMinutes} minutes)`
        : `No stale problems found (older than ${staleMinutes} minutes)`
    });
  } catch (e: any) {
    console.error("auto-resolve error:", e);
    res.status(500).json({ 
      error: e.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    });
  }
});

// ========================
// 28. Test Scheduler API (để test scheduler thủ công)
// ========================
app.post("/api/scheduler/test", async (req, res) => {
  try {
    console.log("[api] Manual scheduler test triggered");
    const result = await runProblemScan(pool, true); // skipLock = true để test ngay cả khi có lock
    
    res.json({
      success: true,
      message: "Scheduler test completed successfully",
      timestamp: new Date().toISOString(),
      results: {
        detected: result.detected,
        resolved: result.resolved,
        problemsCount: result.problems.length,
        problems: result.problems.map(p => ({
          id: p.id,
          priority: p.priority,
          category: p.category,
          title: p.title
        }))
      }
    });
  } catch (e: any) {
    console.error("[api] Scheduler test error:", e);
    res.status(500).json({ 
      success: false,
      error: e.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    });
  }
});

// ========================
// 5️⃣ 404 Handler
// ========================
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// ========================
// 6️⃣ Problem Scheduler
// ========================
if (process.env.ENABLE_PROBLEM_SCHEDULER === "true") {
  console.log("[server] ✅ ENABLE_PROBLEM_SCHEDULER is enabled, starting scheduler...");
  startProblemScheduler(pool);
} else {
  console.log("[server] ⚠️  ENABLE_PROBLEM_SCHEDULER is not set to 'true', scheduler will NOT run.");
  console.log("[server] 💡 To enable: Set ENABLE_PROBLEM_SCHEDULER=true in .env file");
}

// Start server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

