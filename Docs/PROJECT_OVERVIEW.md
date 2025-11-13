# PostgreSQL Dashboard - Tổng Quan Dự Án

## 📋 Tên Dự Án

**PostgreSQL Dashboard**

Một ứng dụng web dashboard để giám sát và phân tích hiệu suất PostgreSQL database real-time.

---

## ✅ Tình Trạng Hiện Tại (Status)

**Cập nhật:** 2024

### 🎯 Tổng Quan
- ✅ **Hoàn thiện**: Dashboard đã được implement đầy đủ với tất cả các tính năng cốt lõi
- ✅ **27 API Endpoints**: Tất cả endpoints đã được implement và test
- ✅ **24 Metrics**: Tất cả metrics đã được hiển thị trong dashboard và được sử dụng bởi Problem Analyzer
- ✅ **6 Tabs**: Sessions, Locks & Blocking, Performance, Maintenance, WAL/Checkpoint/I/O, Phát Hiện Vấn Đề

### 🔧 Tính Năng Đã Hoàn Thành
- ✅ Dynamic Database Connection (kết nối nhiều databases)
- ✅ Auto-refresh System (10s/30s/60s)
- ✅ Preset System (lưu cấu hình)
- ✅ Problem Analyzer (phân tích và phát hiện vấn đề tự động)
- ✅ Export CSV/JSON
- ✅ Alert System (13 quy tắc cảnh báo)
- ✅ Metric Tooltips (chú giải chi tiết)
- ✅ Dark/Light Theme Support

### 📊 Metrics Coverage
- ✅ **Tổng cộng: 24 metrics** được sử dụng trong Problem Analyzer và hiển thị trên Dashboard
- ✅ **Overview**: Connections by State, Cache Hit %, Connection Usage, Deadlocks
- ✅ **Sessions Tab**: 6 metrics (Active/Waiting Sessions, Long-running, Wait Events, Oldest Idle Transaction, TPS & Rollback, Per-DB Cache Hit)
- ✅ **Locks Tab**: 6 metrics (Deadlocks, Locks, Lock Summary, Wait by Lock Mode, Lock Overview per DB, Blocked Sessions)
- ✅ **Performance Tab**: 4 metrics (Cache Hit %, Index Usage, Sequential vs Index Scans, Table Sizes)
- ✅ **Maintenance Tab**: 2 metrics (Autovacuum & Dead Tuples, Dead Tuples & Autovacuum Count)
- ✅ **WAL/Checkpoint/I/O Tab**: 4 metrics (WAL Throughput, Checkpoints, Temp Files, Database Sizes)
- 📖 **Chi tiết**: Xem [METRICS_LIST.md](./METRICS_LIST.md) để biết mô tả đầy đủ về từng metric và các trường dữ liệu

### 🚀 Sẵn Sàng Sử Dụng
Dashboard đã sẵn sàng để sử dụng trong môi trường production. Tất cả các tính năng đã được implement và test.

---

## 🔌 Thông Tin Kết Nối

### Ports
- **Client (Frontend):** `http://localhost:5180`
- **Server (Backend API):** `http://localhost:8080`

### Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Database Client:** `pg` (node-postgres)

---

## 📊 Nguồn Dữ Liệu

### ✅ Dữ Liệu THỰC (Real-time Data)

**KHÔNG phải mockdata!** Tất cả dữ liệu đều được query trực tiếp từ PostgreSQL database thông qua PostgreSQL system views và catalogs.

### Chứng Cứ

1. **Database Connection** - Server kết nối trực tiếp PostgreSQL:
   ```typescript
   // server/src/db.ts
   export const pool = new Pool({
     host: process.env.PGHOST,
     port: Number(process.env.PGPORT ?? 5432),
     user: process.env.PGUSER,
     password: process.env.PGPASSWORD,
     database: process.env.PGDATABASE,
   });
   ```

2. **PostgreSQL System Views được sử dụng:**
   - `pg_stat_activity` - Thông tin về sessions/queries đang chạy
   - `pg_stat_database` - Thống kê database
   - `pg_locks` - Thông tin về locks
   - `pg_stat_user_tables` - Thống kê tables
   - `pg_stat_bgwriter` - Checkpoint statistics
   - `pg_stat_wal` - WAL statistics
   - `pg_stat_progress_vacuum` - Vacuum progress
   - `pg_class` - Table metadata
   - `pg_settings` - Configuration settings
   - `pg_statio_user_tables` - I/O statistics
   - `pg_stat_replication` - Replication statistics
   - `pg_database` - Database information
   - `pg_catalog.pg_statio_user_tables` - Table I/O statistics

3. **Real-time Queries** - Tất cả endpoints query trực tiếp:
   ```sql
   -- Ví dụ: /api/overview
   SELECT COALESCE(state, 'unknown') AS state, COUNT(*)::int AS count
   FROM pg_stat_activity
   WHERE datname = current_database()
   GROUP BY COALESCE(state, 'unknown');
   ```

### Kết Luận

✅ **Dữ liệu 100% THỰC, real-time từ PostgreSQL database**  
❌ Không có mockdata  
✅ Cần kết nối PostgreSQL thực tế để hoạt động

---

## 🔌 API Endpoints - Tổng Quan

### Tổng Số: **27 API Endpoints**

**Phân loại:**
- **3 Core APIs**: Health check, Default connection, List databases
- **24 Metrics APIs**: Các metrics endpoints cho dashboard (bao gồm `/api/overview` và `/api/long-running`)
- **1 Problem Analyzer API**: Phân tích và phát hiện vấn đề tự động

> **Lưu ý:** Đã xóa 8 endpoints nâng cao để đơn giản hóa dashboard cho người dùng mới. Đã thêm lại WAL Throughput và Checkpoints vào tab WAL / Checkpoint / I/O. Đã thêm Problem Analyzer API (`/api/problems`) để phân tích tất cả metrics và phát hiện vấn đề. Xem chi tiết ở phần [🗑️ Các Endpoints Đã Xóa](#-các-endpoints-đã-xóa)

---

## 📡 Chi Tiết API Endpoints

### 🌐 Nhóm 1: Core APIs (3 endpoints)

#### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Mô tả:** Kiểm tra kết nối database
- **Response:**
  ```json
  {
    "ok": true,
    "now": "2024-01-01T12:00:00"
  }
  ```

#### 1b. Default Connection Info
- **Endpoint:** `GET /api/default-connection`
- **Mô tả:** Lấy thông tin connection mặc định từ file `.env` (không trả về password)
- **Response:**
  ```json
  {
    "exists": true,
    "connection": {
      "host": "localhost",
      "port": 5432,
      "user": "postgres",
      "database": "mydb"
    },
    "label": "mydb (localhost:5432)"
  }
  ```

#### 1c. List All Databases
- **Endpoint:** `GET /api/databases`
- **Mô tả:** Lấy danh sách tất cả databases trong PostgreSQL instance
- **Nguồn dữ liệu:** `pg_database`
- **Response:**
  ```json
  {
    "databases": [
      {
        "name": "mydb",
        "host": "localhost",
        "port": 5432,
        "user": "postgres",
        "label": "mydb (localhost:5432)"
      }
    ]
  }
  ```

#### 2. Overview
- **Endpoint:** `GET /api/overview`
- **Mô tả:** Tổng quan hệ thống (connections by state, cache hit %)
- **Nguồn dữ liệu:** `pg_stat_activity`, `pg_stat_database`
- **Response:**
  ```json
  {
    "connectionsByState": [
      { "state": "active", "count": 5 },
      { "state": "idle", "count": 3 }
    ],
    "cacheHitPercent": 99.5
  }
  ```

#### 3. Long-running Queries
- **Endpoint:** `GET /api/long-running?minSec=60`
- **Mô tả:** Danh sách queries đang chạy lâu (≥ minSec giây)
- **Query Parameters:**
  - `minSec` (number): Số giây tối thiểu (default: 60)
- **Nguồn dữ liệu:** `pg_stat_activity`
- **Response:**
  ```json
  [{
    "pid": 12345,
    "user": "postgres",
    "db": "mydb",
    "state": "active",
    "durationSec": 120,
    "startedAt": "2024-01-01T12:00:00",
    "query": "SELECT ...",
    "app": "psql"
  }]
  ```

---

### 📊 Nhóm 2: Basic Metrics (7 endpoints)

#### 4. Deadlocks
- **Endpoint:** `GET /api/metrics/deadlocks`
- **Mô tả:** Số lượng deadlocks theo database
- **Nguồn dữ liệu:** `pg_stat_database`
- **Response:** `[{ datname: string, deadlocks: number }]`

#### 5. Locks
- **Endpoint:** `GET /api/metrics/locks`
- **Mô tả:** Các locks hiện tại theo mode
- **Nguồn dữ liệu:** `pg_locks`
- **Response:** `[{ mode: string, count: number }]`

#### 5b. Lock Summary
- **Endpoint:** `GET /api/metrics/lock-summary`
- **Mô tả:** Tổng hợp lock theo mode, phân biệt Granted vs Waiting
- **Nguồn dữ liệu:** `pg_locks`
- **Response:** `[{ mode: string, granted: number, waiting: number }]`

#### 6. Autovacuum & Dead Tuples
- **Endpoint:** `GET /api/metrics/autovacuum`
- **Mô tả:** Thông tin autovacuum và dead tuples (top 10)
- **Nguồn dữ liệu:** `pg_stat_user_tables`
- **Response:**
  ```json
  [{
    "relname": "orders",
    "n_live_tup": 50000,
    "n_dead_tup": 10000,
    "last_autovacuum": "2024-01-01T12:00:00",
    "last_vacuum": "2024-01-01T11:00:00"
  }]
  ```

#### 7. Index Usage
- **Endpoint:** `GET /api/metrics/index-usage`
- **Mô tả:** Tỷ lệ sử dụng index (top 10 bảng có index usage thấp)
- **Nguồn dữ liệu:** `pg_stat_user_tables`
- **Response:**
  ```json
  [{
    "relname": "orders",
    "idx_scan": 1000,
    "seq_scan": 5000,
    "idx_usage": 16.67
  }]
  ```

#### 8. Temp Files / Sort Spill
- **Endpoint:** `GET /api/metrics/temp-files`
- **Mô tả:** Thông tin về temp files và sort spill
- **Nguồn dữ liệu:** `pg_stat_database`
- **Response:** `[{ datname: string, temp_files: number, temp_bytes: number }]`

#### 9. Database Sizes
- **Endpoint:** `GET /api/metrics/db-sizes`
- **Mô tả:** Kích thước của các database (đối chiếu tăng trưởng)
- **Nguồn dữ liệu:** `pg_database`
- **Response:** `[{ datname: string, size: string }]` (human-readable size)
- **Vị trí:** Tab WAL / Checkpoint / I/O

---

### 🔧 Nhóm 3: Maintenance Metrics (1 endpoint)

#### 14c. Dead Tuples & Autovacuum Count
- **Endpoint:** `GET /api/metrics/dead-tuples-autovacuum`
- **Mô tả:** Top 20 bảng có nhiều dead tuples nhất, kèm thông tin về autovacuum và vacuum count. Sắp xếp theo dead % giảm dần.
- **Nguồn dữ liệu:** `pg_stat_user_tables`
- **Response:**
  ```json
  [{
    "schema": "public",
    "table": "orders",
    "dead_percent": 33.33,
    "autovacuum_count": 150,
    "vacuum_count": 5
  }]
  ```

---

### ⚡ Nhóm 4: Performance Metrics (5 endpoints)

#### 10. Connection Usage
- **Endpoint:** `GET /api/metrics/connection-usage`
- **Mô tả:** Số kết nối hiện tại vs ngưỡng cấu hình max_connections
- **Nguồn dữ liệu:** `pg_stat_activity`, `pg_settings`
- **Response:**
  ```json
  {
    "current_connections": 25,
    "max_connections": 100,
    "used_percent": 25.0
  }
  ```

#### 11. Wait Events
- **Endpoint:** `GET /api/metrics/wait-events`
- **Mô tả:** Phiên đang chạy lâu & đang chờ (wait/wait_event) - top 20
- **Nguồn dữ liệu:** `pg_stat_activity`
- **Response:**
  ```json
  [{
    "pid": 12345,
    "usename": "postgres",
    "datname": "mydb",
    "state": "active",
    "wait_event_type": "IO",
    "wait_event": "DataFileRead",
    "duration": "00:01:30.500",
    "sample_query": "SELECT ..."
  }]
  ```

#### 12. Blocked Sessions
- **Endpoint:** `GET /api/metrics/blocked-sessions`
- **Mô tả:** Phiên bị block do lock - top 20
- **Nguồn dữ liệu:** `pg_locks`, `pg_stat_activity`
- **Response:**
  ```json
  [{
    "blocked_pid": 12345,
    "blocked_user": "user1",
    "blocked_query": "SELECT ...",
    "blocking_pid": 12346,
    "blocking_user": "user2",
    "blocking_query": "UPDATE ...",
    "blocked_state": "active",
    "blocking_state": "active",
    "blocked_duration": "00:00:30.200"
  }]
  ```

---

### 🔒 Nhóm 5: Locking & Blocking Metrics (2 endpoints)

#### 19. Wait by Lock Mode
- **Endpoint:** `GET /api/metrics/wait-by-lock-mode`
- **Mô tả:** Phân phối locks đang chờ (waiting) và đang giữ (held) theo lock type và mode
- **Nguồn dữ liệu:** `pg_locks`
- **Response:**
  ```json
  [{
    "locktype": "relation",
    "mode": "RowExclusiveLock",
    "waiting": 5,
    "held": 120
  }]
  ```

#### 20. Lock Overview per Database
- **Endpoint:** `GET /api/metrics/lock-overview-per-db`
- **Mô tả:** Tổng quan locks theo từng database, phân biệt waiting locks và held locks
- **Nguồn dữ liệu:** `pg_stat_activity`, `pg_locks`
- **Response:**
  ```json
  [{
    "database": "mydb",
    "waiting_locks": 5,
    "held_locks": 120,
    "total_locks": 125
  }]
  ```

---

#### 13. Sequential vs Index Scans
- **Endpoint:** `GET /api/metrics/seq-vs-index-scans`
- **Mô tả:** Scan theo bảng (seq vs idx) – tìm bảng scan tuần tự nhiều - top 20
- **Nguồn dữ liệu:** `pg_stat_user_tables`
- **Response:**
  ```json
  [{
    "schemaname": "public",
    "relname": "orders",
    "seq_scan": 1000,
    "idx_scan": 500,
    "idx_usage_percent": 33.33,
    "n_live_tup": 50000
  }]
  ```

#### 14. Table Sizes
- **Endpoint:** `GET /api/metrics/table-sizes`
- **Mô tả:** Kích thước bảng/index lớn nhất - top 10
- **Nguồn dữ liệu:** `pg_catalog.pg_statio_user_tables`
- **Response:**
  ```json
  [{
    "schemaname": "public",
    "relname": "large_table",
    "total_size": "2 GB",
    "table_size": "1.5 GB",
    "index_size": "500 MB"
  }]
  ```

---

### 🔄 Nhóm 5: Session Metrics (4 endpoints)

#### 15. Oldest Idle-in-Transaction
- **Endpoint:** `GET /api/metrics/oldest-idle-transaction`
- **Mô tả:** Hiển thị những session idle in transaction lâu nhất – có nguy cơ giữ lock, gây block (top 10)
- **Nguồn dữ liệu:** `pg_stat_activity`
- **Response:**
  ```json
  [{
    "database": "mydb",
    "pid": 12345,
    "user": "postgres",
    "state": "idle in transaction",
    "idle_duration": "00:05:30.200",
    "current_query": "SELECT ..."
  }]
  ```

#### 16. TPS & Rollback Rate
- **Endpoint:** `GET /api/metrics/tps-rollback-rate`
- **Mô tả:** Tính số transaction commit và rollback mỗi giây (TPS), cùng phần trăm rollback theo database
- **Nguồn dữ liệu:** `pg_stat_database`
- **Response:**
  ```json
  [{
    "database": "mydb",
    "xact_commit": 15000,
    "xact_rollback": 500,
    "tps": 25.5,
    "rollback_pct": 3.23,
    "stats_reset": "2024-01-01 12:00:00"
  }]
  ```

#### 17. Active vs Waiting Sessions
- **Endpoint:** `GET /api/metrics/active-waiting-sessions`
- **Mô tả:** Đếm số session đang chạy (active), đang chờ lock/I/O (waiting), và idle trong database hiện tại
- **Nguồn dữ liệu:** `pg_stat_activity`
- **Response:**
  ```json
  {
    "active_sessions": 5,
    "waiting_sessions": 2,
    "idle_sessions": 10,
    "total_sessions": 17
  }
  ```

#### 18. Per-DB Cache Hit %
- **Endpoint:** `GET /api/metrics/per-db-cache-hit`
- **Mô tả:** Phân tích hiệu suất cache theo từng database (cache hit percentage)
- **Nguồn dữ liệu:** `pg_stat_database`
- **Response:**
  ```json
  [{
    "database": "mydb",
    "cache_hit_pct": 99.5,
    "blks_hit": 1000000,
    "blks_read": 5000
  }]
  ```

---

### 💾 Nhóm 6: WAL / Checkpoint / I/O Metrics (4 endpoints)

#### 21. WAL Throughput (PG13+)
- **Endpoint:** `GET /api/metrics/wal-throughput`
- **Mô tả:** WAL throughput metrics từ pg_stat_wal (PG13+)
- **Nguồn dữ liệu:** `pg_stat_wal`
- **Response:**
  ```json
  {
    "wal_records": 1000000,
    "wal_fpi": 5000,
    "wal_bytes": 5000000000,
    "wal_bytes_per_sec": 125000.5,
    "stats_reset": "2024-01-01T12:00:00"
  }
  ```

#### 22. Checkpoints & bgwriter
- **Endpoint:** `GET /api/metrics/checkpoints`
- **Mô tả:** Thống kê checkpoints và background writer
- **Nguồn dữ liệu:** `pg_stat_checkpointer`
- **Response:**
  ```json
  {
    "num_timed": 150,
    "num_requested": 5,
    "num_done": 155,
    "write_time": 2500.5,
    "sync_time": 500.2,
    "buffers_written": 1000000,
    "slru_written": 50000,
    "stats_reset": "2024-01-01T12:00:00"
  }
  ```

#### 23. Temp Files / Bytes per DB
- **Endpoint:** `GET /api/metrics/temp-files`
- **Mô tả:** Thông tin về temp files và sort spill theo database
- **Nguồn dữ liệu:** `pg_stat_database`
- **Response:** `[{ datname: string, temp_files: number, temp_bytes: number }]`
- **Vị trí:** Tab WAL / Checkpoint / I/O

#### 24. Database Sizes (đối chiếu tăng trưởng)
- **Endpoint:** `GET /api/metrics/db-sizes`
- **Mô tả:** Kích thước của các database, dùng để đối chiếu tăng trưởng
- **Nguồn dữ liệu:** `pg_database`
- **Response:** `[{ datname: string, size: string }]` (human-readable size)
- **Vị trí:** Tab WAL / Checkpoint / I/O

#### 25. Problem Analyzer
- **Endpoint:** `GET /api/problems?minSec=60`
- **Mô tả:** Phân tích tất cả 24 metrics và phát hiện vấn đề tự động dựa trên các quy tắc định nghĩa sẵn
- **Query Parameters:**
  - `minSec` (number): Số giây tối thiểu cho long-running queries (default: 60)
- **Nguồn dữ liệu:** Tất cả 24 metrics được thu thập bởi `utils/metricsCollector.ts` (không gọi API endpoints, query trực tiếp từ database)
- **Response:**
  ```json
  [{
    "id": "connection-usage-high",
    "priority": "High",
    "category": "Connection",
    "path": "neutral",
    "title": "Connection Usage Quá Cao",
    "message": "Connection usage đang ở 85.5% (85/100 connections)",
    "action": "Xem xét tăng max_connections hoặc tối ưu connection pooling",
    "currentValue": 85.5,
    "threshold": 80,
    "detectedAt": "2024-01-01T12:00:00.000Z"
  }]
  ```
- **Vị trí:** Tab "Phát Hiện Vấn Đề" (Problem Detection) - Tab mặc định khi load dashboard
- **Tính năng:**
  - Phân tích **24 quy tắc (rules)** để phát hiện vấn đề
  - **Trigger System**: Mỗi rule chỉ tạo Problem khi điều kiện trigger được thỏa mãn
  - Phân loại theo mức độ ưu tiên: **High, Medium, Low** (không có Info priority trong code)
  - Phân loại theo danh mục: Connection, Performance, Locking, Cache, Maintenance, I/O, Transaction, Query
  - **Phân loại theo đường dẫn (Path):** Read-Path, Write-Path, Neutral
    - **Read-Path (7 rules):** Rules 3, 4, 10, 11, 11b, 13, 18 - Vấn đề liên quan đến đọc
    - **Write-Path (14 rules):** Rules 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b - Vấn đề liên quan đến ghi
    - **Neutral (3 rules):** Rules 1, 2, 12 - Vấn đề trung tính
  - Hiển thị giá trị hiện tại, ngưỡng, và gợi ý hành động
  - **UI Filtering:** Tab "All", "Read-Path", "Write-Path" để lọc vấn đề theo đường dẫn
- **Problem Storage (Tùy chọn):**
  - Problems có thể được lưu vào database PostgreSQL (schema `monitoring.problems`)
  - **Problem Scheduler**: Tự động phát hiện và lưu problems mỗi 30 phút (khi `ENABLE_PROBLEM_SCHEDULER=true`)
  - Auto-resolve: Tự động resolve problems không còn tồn tại trong lần quét tiếp theo
  - Xem [MONITORING_SETUP_AND_QUERIES.sql](./MONITORING_SETUP_AND_QUERIES.sql) để setup database schema
- **Cấu trúc Backend:**
  - **`problemAnalyzer.ts`**: Orchestrator chính + Neutral rules (Rules 1, 2, 12)
    - Function `analyzeProblems()`: Entry point chính, gọi các analyzer và sắp xếp kết quả
    - Method `analyzeNeutralIssues()`: Xử lý Neutral rules
  - **`problemRules.read.ts`**: Read-Path analyzer (Rules 3, 4, 10, 11, 11b, 13, 18)
    - Class `ReadPathAnalyzer`: Phân tích vấn đề Read-Path
    - Methods: `analyzeCacheIssues()`, `analyzePerformanceIssues()`, `analyzeIOReadIssues()`
  - **`problemRules.write.ts`**: Write-Path analyzer (Rules 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b)
    - Class `WritePathAnalyzer`: Phân tích vấn đề Write-Path
    - Methods: `analyzeConnectionWriteIssues()`, `analyzeLockingIssues()`, `analyzeTransactionIssues()`, `analyzeMaintenanceIssues()`, `analyzeIOWriteIssues()`
  - **`repositories/problems.ts`**: Repository để lưu problems vào database
    - Function `upsertProblem()`: Upsert một problem (INSERT ... ON CONFLICT)
    - Function `saveProblems()`: Lưu nhiều problems trong transaction
  - **`scheduler.ts`**: Problem Scheduler - Tự động phát hiện và lưu problems
    - Function `startProblemScheduler()`: Khởi động scheduler chạy mỗi 30 phút
    - Function `collectMetricsForAnalyzer()`: Thu thập tất cả 24 metrics
    - Sử dụng PostgreSQL advisory lock để tránh overlap

---

## 🗑️ Các Endpoints Đã Xóa

**Lý do:** Đơn giản hóa dashboard cho người dùng mới bằng cách loại bỏ các metrics nâng cao, ít sử dụng.

### Danh Sách 8 Endpoints Đã Xóa:

#### 1. Replication Lag
- **Endpoint đã xóa:** `GET /api/metrics/replication-lag`
- **Lý do:** Chỉ cần khi có replica, nên ẩn mặc định

#### 2. Temp IO (Spill Rate)
- **Endpoint đã xóa:** `GET /api/metrics/temp-io`
- **Lý do:** Metric nâng cao, trùng với Temp Files

#### 3. Autovacuum Activity (Detailed)
- **Endpoint đã xóa:** `GET /api/metrics/autovacuum-activity`
- **Lý do:** Đã có Autovacuum & Dead Tuples cơ bản

#### 4. Blocking Details
- **Endpoint đã xóa:** `GET /api/metrics/blocking-details`
- **Lý do:** Đã có Blocked Sessions đơn giản hơn

#### 5. Running Vacuum Processes
- **Endpoint đã xóa:** `GET /api/metrics/running-vacuum`
- **Lý do:** Metric chi tiết, chỉ cần khi debug

#### 6. Freeze Age Risk
- **Endpoint đã xóa:** `GET /api/metrics/freeze-age-risk`
- **Lý do:** Metric nâng cao, ít gặp trong thực tế

#### 7. Bloat Estimation (Heuristic)
- **Endpoint đã xóa:** `GET /api/metrics/bloat-estimation`
- **Lý do:** Metric nâng cao, heuristic không chính xác

#### 8. Performance Settings
- **Endpoint đã xóa:** `GET /api/metrics/performance-settings`
- **Lý do:** Chỉ đọc, không tương tác, nên ẩn mặc định

---

## 📈 Tổng Kết Endpoints

| # | Endpoint | Nhóm | Mô Tả |
|---|----------|------|-------|
| 1 | `/api/health` | Core | Health check |
| 1b | `/api/default-connection` | Core | Default connection info từ .env |
| 1c | `/api/databases` | Core | List all databases |
| 2 | `/api/overview` | Core | Tổng quan hệ thống |
| 3 | `/api/long-running` | Core | Long-running queries |
| 4 | `/api/metrics/deadlocks` | Basic | Deadlocks count |
| 5 | `/api/metrics/locks` | Basic | Current locks |
| 5b | `/api/metrics/lock-summary` | Basic | Lock summary (granted vs waiting) |
| 6 | `/api/metrics/autovacuum` | Basic | Autovacuum & dead tuples |
| 7 | `/api/metrics/index-usage` | Basic | Index usage statistics |
| 8 | `/api/metrics/temp-files` | Basic | Temp files / sort spill |
| 9 | `/api/metrics/db-sizes` | Basic | Database sizes |
| 10 | `/api/metrics/connection-usage` | Performance | Connection usage |
| 11 | `/api/metrics/wait-events` | Performance | Wait events |
| 12 | `/api/metrics/blocked-sessions` | Performance | Blocked sessions |
| 13 | `/api/metrics/seq-vs-index-scans` | Performance | Sequential vs index scans |
| 14 | `/api/metrics/table-sizes` | Performance | Largest table/index sizes |
| 14c | `/api/metrics/dead-tuples-autovacuum` | Maintenance | Dead tuples & autovacuum count |
| 15 | `/api/metrics/oldest-idle-transaction` | Session | Oldest idle-in-transaction sessions |
| 16 | `/api/metrics/tps-rollback-rate` | Session | TPS & rollback rate per database |
| 17 | `/api/metrics/active-waiting-sessions` | Session | Active vs waiting sessions |
| 18 | `/api/metrics/per-db-cache-hit` | Session | Per-database cache hit percentage |
| 19 | `/api/metrics/wait-by-lock-mode` | Locking & Blocking | Wait by lock mode (waiting vs held) |
| 20 | `/api/metrics/lock-overview-per-db` | Locking & Blocking | Lock overview per database |
| 21 | `/api/metrics/wal-throughput` | WAL / Checkpoint / I/O | WAL throughput (PG13+) |
| 22 | `/api/metrics/checkpoints` | WAL / Checkpoint / I/O | Checkpoints & bgwriter |
| 23 | `/api/metrics/temp-files` | WAL / Checkpoint / I/O | Temp files / bytes per DB |
| 24 | `/api/metrics/db-sizes` | WAL / Checkpoint / I/O | Database sizes (đối chiếu tăng trưởng) |
| 25 | `/api/problems` | Problem Analyzer | Phân tích và phát hiện vấn đề tự động |

**Tổng cộng: 27 API endpoints**
- **3 Core endpoints**: `/api/health`, `/api/default-connection`, `/api/databases`
- **23 Metrics endpoints**: Tất cả các endpoints `/api/metrics/*` và `/api/overview`, `/api/long-running`
- **1 Problem Analyzer endpoint**: `/api/problems`

---

## 🗂️ Cấu Trúc Project

```
PostGre_24EndPoints_Setting/
├── client/                    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   ├── App.tsx            # App component
│   │   ├── main.tsx           # Entry point
│   │   ├── types.ts           # Tất cả TypeScript types
│   │   ├── index.css          # Global styles
│   │   ├── App.css            # App-specific styles
│   │   ├── hooks/
│   │   │   ├── useDashboardData.ts      # Custom hook cho data fetching
│   │   │   ├── useAutoRefresh.ts        # Auto-refresh hook với anti-throttle
│   │   │   ├── usePreset.ts             # Preset system (lưu cấu hình)
│   │   │   ├── useSnapshot.ts           # Snapshot management hook
│   │   │   └── useDatabaseConnections.ts # Database connections management
│   │   ├── contexts/          # React Context providers
│   │   │   ├── DatabaseConnectionContext.tsx  # Database connection context
│   │   │   └── SettingsContext.tsx            # Settings context
│   │   ├── utils/
│   │   │   ├── styles.ts      # Style constants
│   │   │   ├── formatters.ts  # Format helpers
│   │   │   ├── export.ts      # Export CSV/JSON utilities
│   │   │   ├── i18n.ts        # Internationalization utilities
│   │   │   └── themeStyles.ts # Theme styling utilities
│   │   ├── components/
│   │   │   ├── cards/         # Metric cards components (nhóm theo tab)
│   │   │   │   ├── Sessions/  # Tab Sessions metrics
│   │   │   │   │   ├── ActiveWaitingSessionsCard.tsx
│   │   │   │   │   ├── OldestIdleTransactionCard.tsx
│   │   │   │   │   ├── LongRunningCard.tsx
│   │   │   │   │   ├── WaitEventsCard.tsx
│   │   │   │   │   ├── TpsRollbackRateCard.tsx
│   │   │   │   │   └── PerDbCacheHitCard.tsx
│   │   │   │   ├── Locks/     # Tab Locks & Blocking metrics
│   │   │   │   │   ├── DeadlocksCard.tsx
│   │   │   │   │   ├── LocksCard.tsx
│   │   │   │   │   ├── LockSummaryCard.tsx
│   │   │   │   │   ├── WaitByLockModeCard.tsx
│   │   │   │   │   ├── LockOverviewPerDBCard.tsx
│   │   │   │   │   └── BlockedSessionsCard.tsx
│   │   │   │   ├── Performance/  # Tab Performance metrics
│   │   │   │   │   ├── IndexUsageCard.tsx
│   │   │   │   │   ├── SeqVsIdxScansCard.tsx
│   │   │   │   │   └── TableSizesCard.tsx
│   │   │   │   ├── WALCheckpointIO/  # Tab WAL / Checkpoint / I/O metrics
│   │   │   │   │   ├── WALThroughputCard.tsx
│   │   │   │   │   ├── CheckpointsCard.tsx
│   │   │   │   │   ├── TempFilesCard.tsx
│   │   │   │   │   └── DatabaseSizesCard.tsx
│   │   │   │   └── Maintenance/  # Tab Maintenance metrics
│   │   │   │       ├── AutovacuumCard.tsx
│   │   │   │       └── DeadTuplesAutovacuumCard.tsx
│   │   │   ├── panel/         # Panel components
│   │   │   │   ├── AdvicePanel.tsx        # Advice engine component
│   │   │   │   └── SnapshotComparePanel.tsx  # Snapshot compare component
│   │   │   ├── sections/      # Section components
│   │   │   │   ├── OverviewSection.tsx
│   │   │   │   └── TempIOAndCheckpointSection.tsx
│   │   │   ├── ui/            # UI components (tổ chức theo chức năng)
│   │   │   │   ├── Dashboard/  # Dashboard-specific components
│   │   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   │   ├── MetricsTabs.tsx  # 6 tabs: Sessions, Locks, Performance, Maintenance, WAL/Checkpoint/I/O, Phát Hiện Vấn Đề
│   │   │   │   │   └── ProblemDetectionTab.tsx  # Tab hiển thị vấn đề từ Problem Analyzer
│   │   │   │   ├── Layout/   # Layout/Page components
│   │   │   │   │   └── DatabaseSelector.tsx
│   │   │   │   ├── Modals/   # Modal components
│   │   │   │   │   ├── AddDatabaseForm.tsx
│   │   │   │   │   └── SettingsModal.tsx
│   │   │   │   └── Shared/   # Shared/Reusable UI components
│   │   │   │       ├── ErrorDisplay.tsx
│   │   │   │       └── MetricTooltip.tsx
│   │   │   └── database/      # Database-related components (reserved)
│   │   └── assets/
│   │       └── react.svg
│   ├── public/
│   │   └── vite.svg
│   ├── index.html
│   ├── vite.config.ts         # Vite config (port: 5180)
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── package.json
│   └── README.md
│
├── server/                    # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts           # Express server với 27 API endpoints
│   │   ├── db.ts              # PostgreSQL connection pool
│   │   ├── analyzer/          # Problem Analyzer modules
│   │   │   ├── problemAnalyzer.ts  # Orchestrator chính + Neutral rules (Rules 1, 2, 12)
│   │   │   ├── problemRules.read.ts  # Read-Path rules analyzer (Rules 3, 4, 10, 11, 11b, 13, 18)
│   │   │   └── problemRules.write.ts # Write-Path rules analyzer (Rules 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b)
│   │   ├── repositories/      # Data repositories
│   │   │   ├── problems.ts    # Repository để lưu problems vào database
│   │   │   └── scheduler.ts   # Problem Scheduler - Tự động phát hiện và lưu problems (mỗi 30 phút)
│   │   └── utils/             # Utility functions
│   │       ├── instanceInfo.ts # Utility để lấy thông tin instance
│   │       └── metricsCollector.ts # Centralized metrics collection (24 metrics) cho Problem Analyzer
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                   # Database connection config (cần tạo)
│
├── PROJECT_OVERVIEW.md        # File này - Tổng quan dự án
├── METRICS_LIST.md            # Danh sách 24 metrics chi tiết với mô tả và giải thích các trường
├── PROBLEM_ANALYZER_GUIDE.md   # Hướng dẫn về Problem Analyzer và 24 rules
├── TYPE_MISMATCH_ERRORS.md    # Tài liệu về type mismatch errors
└── UI_OVERVIEW.md             # Tài liệu về UI/UX overview
```

---

## 🔧 Yêu Cầu Kết Nối

Để dashboard hoạt động, bạn cần:

1. **PostgreSQL Database** đang chạy
2. **File `.env`** trong thư mục `server/` với các biến:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGUSER=your_username
   PGPASSWORD=your_password
   PGDATABASE=your_database
   ```
3. **Permissions:** User PostgreSQL cần quyền đọc các system views:
   - `pg_stat_activity`
   - `pg_stat_database`
   - `pg_locks`
   - `pg_stat_user_tables`
   - `pg_stat_bgwriter`
   - `pg_stat_wal`
   - `pg_stat_progress_vacuum`
   - `pg_class`
   - `pg_settings`
   - v.v.

---

## 🚀 Cách Chạy

### 1. Start Server
```bash
cd server
npm install
npm run dev
# Server chạy tại http://localhost:8080
```

### 2. Start Client
```bash
cd client
npm install
npm run dev
# Client chạy tại http://localhost:5180
```

### 3. Truy Cập Dashboard
Mở browser: `http://localhost:5180`

---

## 📝 Ghi Chú

- Tất cả dữ liệu là **real-time** từ PostgreSQL
- Dashboard tự động refresh khi click nút "Refresh"
- Có thể điều chỉnh `minSec` để filter long-running queries

---

## ✨ Tính Năng

### 0. 🔌 Kết Nối Database Động (Dynamic Database Connection)

Dashboard hỗ trợ kết nối và chuyển đổi giữa nhiều PostgreSQL databases:

#### Tính Năng:
- **Database Selector**: Màn hình chọn database khi khởi động
- **Lưu kết nối**: Lưu danh sách databases đã kết nối vào localStorage
- **Kết nối động**: Gửi connection config qua HTTP headers (`X-DB-Host`, `X-DB-Port`, `X-DB-User`, `X-DB-Password`, `X-DB-Database`)
- **Test connection**: Kiểm tra kết nối trước khi vào dashboard
- **Default connection**: Tự động load connection từ `.env` nếu có

#### API Support:
- Tất cả endpoints hỗ trợ connection config qua headers
- Server tự động tạo connection pool từ headers nếu có
- Fallback về default pool từ `.env` nếu không có headers

**Vị trí**: Component `DatabaseSelector` - màn hình đầu tiên khi mở app

### 1. 🚨 Hệ Thống Cảnh Báo (Alerting System)

Dashboard tự động hiển thị cảnh báo trực quan khi các metrics vượt ngưỡng:

#### 13 Quy Tắc Cảnh Báo:

1. **Connection Usage > 80%** → Badge "⚠ High" (màu cam/đỏ)
   - Cảnh báo khi gần hết kết nối
   - Hiển thị ở Overview Section và giá trị
   - Màu đỏ nếu > 90%, cam nếu > 80%

2. **Cache Hit < 95%** → Badge "⚠ Low" (màu cam/đỏ)
   - Cảnh báo khi cache hit thấp
   - Hiển thị ở Overview Section và Per-DB Cache Hit Card
   - Màu đỏ nếu < 90%, cam nếu < 95%

3. **Deadlocks > 0** → Badge "⚠ High" (màu đỏ)
   - Phát hiện deadlock trong hệ thống
   - Hiển thị ở Overview Section, Deadlocks Card và từng dòng có deadlock

4. **Index Usage < 50%** → Badge "⚠ Low" (màu cam)
   - Cảnh báo khi ít sử dụng index
   - Hiển thị ở Index Usage Card tiêu đề

5. **Lock Summary Waiting > 0** → Badge "⚠ Waiting" (màu đỏ)
   - Cảnh báo có lock đang chờ
   - Hiển thị ở Lock Summary Card tiêu đề và từng dòng có waiting

6. **Blocked Sessions > 0** → Badge "⚠ High" (màu đỏ)
   - Phát hiện session đang bị block
   - Hiển thị ở Blocked Sessions Card tiêu đề

7. **Wait by Lock Mode Waiting > 0** → Badge "⚠ Waiting" (màu đỏ)
   - Cảnh báo có lock đang chờ theo mode
   - Hiển thị ở Wait by Lock Mode Card tiêu đề và từng dòng có waiting

8. **Lock Overview per Database Waiting > 0** → Badge "⚠ Waiting" (màu đỏ)
   - Cảnh báo có lock đang chờ trong database
   - Hiển thị ở Lock Overview per Database Card tiêu đề và từng dòng có waiting

9. **Active vs Waiting Sessions Waiting > 0** → Badge "⚠" (màu đỏ)
   - Cảnh báo có session đang chờ
   - Hiển thị ở Active vs Waiting Sessions Card giá trị

10. **TPS & Rollback Rate Rollback % > 5%** → Badge "⚠" (màu đỏ)
    - Cảnh báo tỷ lệ rollback cao
    - Hiển thị ở TPS & Rollback Rate Card từng dòng có rollback % > 5%

11. **Per-DB Cache Hit % < 95%** → Badge "⚠" (màu cam)
    - Cảnh báo cache hit thấp theo database
    - Hiển thị ở Per-DB Cache Hit Card từng dòng có cache hit < 95%

12. **Dead Tuples & Autovacuum Count Dead % > 50%** → Badge "⚠ High" (màu đỏ)
    - Cảnh báo dead tuples quá nhiều
    - Hiển thị ở Dead Tuples & Autovacuum Count Card tiêu đề và từng dòng có dead % > 50%

13. **Temp Files > 0** → Cảnh báo trong tooltip
    - Cảnh báo có temp files được tạo (có thể cần tăng work_mem)
    - Hiển thị trong Temp Files Card tooltip

### 2. 💡 Advice Engine (Hệ Thống Khuyến Nghị)

Panel tự động phân tích metrics và đưa ra khuyến nghị theo mức độ ưu tiên:

#### Mức Độ Ưu Tiên:
- **🔴 High Priority**: Connection Usage cao, Deadlocks, Blocked Sessions, Temp IO cao
- **🟡 Medium Priority**: Checkpoint quá dày, Index Usage thấp
- **🔵 Info**: Các khuyến nghị thông tin

#### Mỗi Khuyến Nghị Bao Gồm:
- **Message**: Mô tả vấn đề cụ thể
- **Action**: Hành động khuyến nghị (ví dụ: "Xem xét tăng work_mem để giảm temp file spills")

**Vị trí**: Panel "💡 Advice & Recommendations" ở cuối AdditionalMetricsSection

### 3. 🔄 Auto-Refresh System

Tự động làm mới dữ liệu theo chu kỳ:

#### Tính Năng:
- **Toggle ON/OFF**: Bật/tắt auto-refresh
- **Chọn chu kỳ**: 10s / 30s / 60s
- **Anti-throttle**: Bỏ qua request nếu đang loading (tránh chồng request)
- **Background handling**: Tạm dừng khi tab ở background (Page Visibility API)

**UI**: Checkbox toggle và dropdown chọn interval trong DashboardHeader

### 4. 💾 Preset System (Lưu Cấu Hình)

Tự động lưu và khôi phục cấu hình người dùng:

#### Dữ Liệu Được Lưu:
- `minSec` (lọc long-running queries)
- Auto-refresh state (enabled/disabled)
- Auto-refresh interval (10s/30s/60s)

#### Tính Năng:
- **Auto-save**: Tự động lưu khi thay đổi
- **Auto-restore**: Tự động khôi phục khi mở lại app (F5 vẫn giữ preset)
- **Schema Versioning**: Có `schemaVersion` để tránh lỗi khi đổi cấu trúc
  - Version hiện tại: `1.0.0`
  - Tự động reset về mặc định nếu version không khớp (không crash)

**Storage**: localStorage với key `pg_dashboard_preset`

### 5. 🔍 Problem Analyzer (Phân Tích Vấn Đề)

Module backend tự động phân tích tất cả 24 metrics và phát hiện vấn đề:

#### Tính Năng:
- **24 Quy Tắc Phân Tích**: Phân tích các vấn đề về Connection, Performance, Locking, Cache, Maintenance, I/O, Transaction, Query
- **Trigger System**: Mỗi rule có điều kiện trigger - chỉ tạo Problem khi điều kiện được thỏa mãn (TRUE)
  - **Trigger** = Điều kiện được thỏa mãn → Tạo Problem → Hiển thị trên UI
  - **Không Trigger** = Điều kiện không thỏa mãn → Không tạo Problem → Không hiển thị
  - Giúp tự động phát hiện vấn đề, chỉ báo cáo khi có vấn đề thật sự, tiết kiệm tài nguyên
- **Phân Loại Ưu Tiên**: High, Medium, Low (không có Info priority trong code)
- **Phân Loại Danh Mục**: 8 danh mục khác nhau (Connection, Performance, Locking, Cache, Maintenance, I/O, Transaction, Query)
- **Phân Loại Đường Dẫn (Path)**: Read-Path, Write-Path, Neutral
  - **Read-Path (7 rules)**: Rules 3, 4, 10, 11, 11b, 13, 18 - Cache hit, Index usage, Sequential scans, Read I/O waits, Temp files
  - **Write-Path (14 rules)**: Rules 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b - Locks, Deadlocks, WAL, Checkpoints, Autovacuum, Dead tuples, Transaction rollback
  - **Neutral (3 rules)**: Rules 1, 2, 12 - Connection usage, Waiting sessions, Long-running queries
- **Hiển Thị Chi Tiết**: Giá trị hiện tại, ngưỡng, thời điểm phát hiện
- **Gợi Ý Hành Động**: Mỗi vấn đề có gợi ý cụ thể để xử lý

#### Chi Tiết 24 Rules:

**🔌 Connection Issues (3 rules):**
- **Rule 1**: Connection Usage > 80% (Medium: 80-90%, High: >90%)
- **Rule 2**: Waiting Sessions > 0 (High) - Chỉ trigger khi không có blocked sessions và I/O wait events
- **Rule 2b**: Idle in Transaction > 5 (High)

**💾 Cache Issues (2 rules):**
- **Rule 3**: Cache Hit < 95% Overall (Medium: 90-95%, High: <90%)
- **Rule 4**: Cache Hit < 95% Per-DB (Medium: 90-95%, High: <90%)

**🔒 Locking Issues (6 rules):**
- **Rule 5**: Deadlocks > 0 (High)
- **Rule 6**: Lock Summary Waiting > 0 (High)
- **Rule 7**: Blocked Sessions > 0 (High)
- **Rule 8**: Wait by Lock Mode > 0 (High)
- **Rule 9**: Lock Overview per DB > 0 (High)
- **Rule 9b**: Total Locks > 1000 (Medium)

**⚡ Performance Issues (3 rules):**
- **Rule 10**: Index Usage < 50% (Medium)
- **Rule 11**: Sequential Scan < 50% (Medium) - Chỉ trigger khi Rule 10 chưa trigger
- **Rule 11b**: Table Sizes > 10 GB (Low)

**👥 Session Issues (4 rules):**
- **Rule 12**: Long-running Queries (Medium: >30s, High: >5min)
- **Rule 13**: Wait Events I/O (Medium) - Nếu trigger, Rule 2 sẽ không trigger
- **Rule 14**: Oldest Idle Transaction (High)
- **Rule 15**: Rollback Rate > 5% (High)

**🧹 Maintenance Issues (2 rules):**
- **Rule 16**: Dead Tuples > 50% (High)
- **Rule 17**: Autovacuum Not Recent > 7 days (Medium)

**📁 I/O Issues (4 rules):**
- **Rule 18**: Temp Files > 0 (Medium: >0, High: >1GB)
- **Rule 19**: WAL Throughput > 100 MB/s (Medium)
- **Rule 20**: Checkpoints Too Frequent (Medium: >100 checkpoints và >1000ms)
- **Rule 20b**: Database Sizes > 100 GB (Low)

> 📖 **Tài liệu chi tiết:** Xem [PROBLEM_ANALYZER_RULES.md](./PROBLEM_ANALYZER_RULES.md) để biết mô tả đầy đủ về từng rule, điều kiện trigger, và hành động khuyến nghị.

#### UI Tab "Phát Hiện Vấn Đề":
- **Vị trí**: Tab cuối cùng trong MetricsTabs, **mặc định active khi load dashboard**
- **Filtering Tabs**: 3 tabs để lọc vấn đề theo đường dẫn
  - **All**: Hiển thị tất cả vấn đề (Read-Path + Write-Path + Neutral)
  - **Read-Path**: Chỉ hiển thị vấn đề liên quan đến đọc
  - **Write-Path**: Chỉ hiển thị vấn đề liên quan đến ghi
- **Hiển thị theo mức độ ưu tiên**: High → Medium → Low
- **Màu sắc cảnh báo**: Đỏ (High), Cam (Medium), Vàng (Low)
- **Tooltip giải thích**: Giải thích chi tiết về từng vấn đề
- **Tự động refresh**: Cập nhật khi dashboard refresh
- **Problem Count Badge**: Hiển thị số lượng vấn đề cho mỗi tab

#### Cấu Trúc Backend:
- **`analyzer/problemAnalyzer.ts`**: Orchestrator chính + Neutral rules (Rules 1, 2, 12)
  - Function `analyzeProblems()`: Entry point chính, gọi các analyzer và sắp xếp kết quả theo priority
  - Class `ProblemAnalyzer`: Quản lý toàn bộ quá trình phân tích
  - Method `analyzeNeutralIssues()`: Xử lý Neutral rules (Connection và Query issues)
- **`analyzer/problemRules.read.ts`**: Read-Path analyzer (Rules 3, 4, 10, 11, 11b, 13, 18)
  - Class `ReadPathAnalyzer`: Phân tích vấn đề Read-Path
  - Methods: `analyzeCacheIssues()`, `analyzePerformanceIssues()`, `analyzeIOReadIssues()`
- **`analyzer/problemRules.write.ts`**: Write-Path analyzer (Rules 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b)
  - Class `WritePathAnalyzer`: Phân tích vấn đề Write-Path
  - Methods: `analyzeConnectionWriteIssues()`, `analyzeLockingIssues()`, `analyzeTransactionIssues()`, `analyzeMaintenanceIssues()`, `analyzeIOWriteIssues()`
- **`repositories/problems.ts`**: Repository để lưu problems vào database
  - Function `upsertProblem()`: Upsert một problem (INSERT ... ON CONFLICT)
  - Function `saveProblems()`: Lưu nhiều problems trong transaction (hỗ trợ cả Pool và PoolClient)
- **`repositories/scheduler.ts`**: Problem Scheduler - Tự động phát hiện và lưu problems
  - Function `startProblemScheduler()`: Khởi động scheduler chạy mỗi 30 phút (cron: `*/30 * * * *`)
  - Function `runProblemScan()`: Chạy một lần scan để phát hiện và lưu problems (có thể gọi manual hoặc từ cron)
  - **Tính năng**: Tự động phát hiện, lưu vào database, và auto-resolve problems không còn tồn tại
  - **Advisory Lock**: Sử dụng PostgreSQL advisory lock (`pg_try_advisory_lock`) để tránh overlap khi có nhiều instances
  - **Kích hoạt**: Set `ENABLE_PROBLEM_SCHEDULER=true` trong `.env`
  - **Lightweight**: Không chứa logic nặng, chỉ điều phối: cron → collect metrics → analyze → upsert → resolve
- **`utils/metricsCollector.ts`**: Centralized metrics collection
  - Function `collectMetricsForAnalyzer()`: Thu thập tất cả 24 metrics từ PostgreSQL system views
  - **QueryExecutor**: Abstract interface để làm việc với cả `Pool` và `PoolClient`
  - **Nguồn dữ liệu**: `pg_stat_activity`, `pg_stat_database`, `pg_locks`, `pg_stat_user_tables`, `pg_stat_wal`, `pg_stat_checkpointer`, v.v.
  - **Sử dụng bởi**: Problem Analyzer API (`/api/problems`) và Problem Scheduler

> 📖 **Tài liệu kỹ thuật:** Xem [TRIGGER_IMPLEMENTATION.md](./TRIGGER_IMPLEMENTATION.md) để hiểu chi tiết về trigger system, cách hoạt động, và implementation.

**Vị trí**: Tab "🔍 Phát Hiện Vấn Đề" trong MetricsTabs (tab mặc định khi load)

### 6. 📥 Export & Report

Xuất dữ liệu ra file:

#### Export CSV/JSON cho các Section:
- ✅ Long-running queries
- ✅ Blocked Sessions
- ✅ Sequential vs Index Scans
- ✅ Table Sizes

#### Tính Năng Export:
- **CSV với UTF-8 BOM**: Excel-safe, không lỗi font/ký tự
- **JSON formatted**: Dễ đọc và xử lý
- **Export đúng bộ lọc**: Chỉ export dữ liệu đang hiển thị (không phải toàn bộ)

#### Copy Full Query:
- **Nút "Copy Full"**: Copy toàn bộ query cho Blocked Sessions
- Hiển thị khi query > 150 ký tự (tự động cắt preview)
- Hỗ trợ cả `blocked_query` và `blocking_query`

**Vị trí**: Export buttons (📥 CSV, 📥 JSON) ở header của mỗi section

### 7. 📖 Metric Tooltips (Chú Giải Thông Số)

Tooltip giải thích chi tiết cho từng metric:

#### Metrics Có Tooltip:
1. **Cache Hit %**: Giải thích về shared_buffers và hiệu suất cache
2. **Connection Usage**: Phần trăm kết nối, ngưỡng cảnh báo
3. **Deadlocks**: Ý nghĩa và tác động
4. **Index Usage**: So sánh sequential vs index scan
5. **Autovacuum & Dead Tuples**: Dead tuples và tác động
6. **Temp IO**: Spill ra disk khi thiếu work_mem
7. **Checkpoint Frequency**: Tần suất checkpoint và I/O
8. **Blocked Sessions**: Blocking và locking
9. **Sequential vs Index Scans**: Tỷ lệ scan
10. **Long-running queries**: Queries chạy lâu

#### Nội Dung Tooltip:
- **Title**: Tên metric
- **Description**: Giải thích ý nghĩa
- **✓ Giá trị tốt**: Màu xanh, ví dụ "> 95% - Cache hoạt động tốt"
- **⚠ Giá trị cảnh báo**: Màu cam, ví dụ "> 80% - Cảnh báo"
- **Thông tin bổ sung**: Gợi ý xử lý

**UI**: Icon "?" bên cạnh tên metric, hover để xem tooltip

---

## 📝 Ghi Chú Cũ

- Tất cả dữ liệu là **real-time** từ PostgreSQL
- Dashboard tự động refresh khi click nút "Refresh"
- Có thể điều chỉnh `minSec` để filter long-running queries

---

## 🔗 Liên Kết Hữu Ích

- [PostgreSQL Statistics Views](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [pg_stat_activity](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW)
- [pg_stat_database](https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-DATABASE-VIEW)

---

**Tạo ngày:** 2024  
**Tác giả:** AI Assistant  
**Dự án:** PostgreSQL Dashboard

