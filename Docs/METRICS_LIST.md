# Danh Sách Metrics - PostgreSQL Dashboard

> 📊 **Tổng cộng: 24 metrics** được sử dụng trong Problem Analyzer và hiển thị trên Dashboard

---

## 📋 Bảng Tóm Tắt 24 Metrics

| # | Tên Metric | API Endpoint | Nhóm | Mô Tả Ngắn |
|---|------------|--------------|------|-------------|
| 1 | Connections by State | `/api/overview` | Overview | Số lượng connections theo trạng thái (active, idle, idle in transaction) |
| 2 | Cache Hit % | `/api/overview` | Overview | Tỷ lệ cache hit tổng thể của database (%) |
| 3 | Long-running queries | `/api/long-running` | Core | Queries chạy ≥ số giây chỉ định (minSec) |
| 4 | Deadlocks | `/api/metrics/deadlocks` | Basic | Số lượng deadlocks theo database |
| 5 | Current Locks by Mode | `/api/metrics/locks` | Basic | Locks hiện tại theo mode (AccessShareLock, ExclusiveLock, v.v.) |
| 5b | Lock Summary | `/api/metrics/lock-summary` | Basic | Tổng hợp lock: Granted vs Waiting |
| 6 | Autovacuum & Dead Tuples | `/api/metrics/autovacuum` | Basic | Top 10 bảng: live/dead tuples, last autovacuum/vacuum |
| 7 | Index Usage | `/api/metrics/index-usage` | Basic | Top 10 bảng có index usage thấp (idx_scan, seq_scan, idx_usage %) |
| 8 | Temp Files / Sort Spill | `/api/metrics/temp-files` | Basic | Temp files và temp bytes theo database |
| 9 | Database Sizes | `/api/metrics/db-sizes` | Basic | Kích thước database (human-readable) |
| 10 | Connection Usage | `/api/metrics/connection-usage` | Performance | Current vs Max connections, Used % (⚠ >80%) |
| 11 | Wait Events (top 20) | `/api/metrics/wait-events` | Performance | Sessions đang chờ: wait_event_type, wait_event, duration |
| 12 | Blocked Sessions (top 20) | `/api/metrics/blocked-sessions` | Performance | Sessions bị block: blocked_pid, blocking_pid, queries, duration |
| 13 | Sequential vs Index Scans | `/api/metrics/seq-vs-index-scans` | Performance | Top 20 bảng: seq_scan, idx_scan, idx_usage % (⚠ <50%) |
| 14 | Largest Table/Index Sizes | `/api/metrics/table-sizes` | Performance | Top 10 bảng lớn nhất: total_size, table_size, index_size |
| 14c | Dead Tuples & Autovacuum Count | `/api/metrics/dead-tuples-autovacuum` | Maintenance | Top 20 bảng: dead_percent (⚠ >50%), autovacuum_count, vacuum_count |
| 15 | Active vs Waiting Sessions | `/api/metrics/active-waiting-sessions` | Session | Đếm: active, waiting (⚠ >0), idle, total sessions |
| 16 | Oldest Idle-in-Transaction | `/api/metrics/oldest-idle-transaction` | Session | Top 10: database, pid, user, idle_duration, current_query |
| 17 | TPS & Rollback Rate | `/api/metrics/tps-rollback-rate` | Session | TPS, rollback_pct (⚠ >5%), commits, rollbacks theo database |
| 18 | Per-DB Cache Hit % | `/api/metrics/per-db-cache-hit` | Session | Cache hit % theo database (⚠ <95%), blks_hit, blks_read |
| 19 | Wait by Lock Mode | `/api/metrics/wait-by-lock-mode` | Locking | Locks đang chờ/giữ theo locktype và mode (⚠ waiting >0) |
| 20 | Lock Overview per Database | `/api/metrics/lock-overview-per-db` | Locking | Waiting locks, held locks, total locks theo database (⚠ waiting >0) |
| 21 | WAL Throughput (PG13+) | `/api/metrics/wal-throughput` | WAL/I/O | WAL records, FPI, bytes, bytes/sec, stats_reset |
| 22 | Checkpoints & bgwriter | `/api/metrics/checkpoints` | WAL/I/O | Timed/requested/done checkpoints, write_time, sync_time, buffers_written |
| 23 | Temp Files / Bytes per DB | `/api/metrics/temp-files` | WAL/I/O | Temp files và temp bytes theo database (⚠ >0) |
| 24 | Database Sizes | `/api/metrics/db-sizes` | WAL/I/O | Kích thước database (human-readable) |

---

## 📖 Mô Tả Chi Tiết Từng Metric

### 1. Connections by State
**Mô tả:** Đếm số lượng kết nối PostgreSQL theo trạng thái hiện tại. Giúp theo dõi tình trạng sử dụng connections và phát hiện các kết nối bất thường (ví dụ: quá nhiều idle in transaction). **Nguồn:** `pg_stat_activity`  
**Các trường:**
- `state` (string): Trạng thái kết nối - `active` (đang chạy query), `idle` (chờ query), `idle in transaction` (đã bắt đầu transaction nhưng chưa commit/rollback), `unknown` (null)
- `count` (number): Số lượng connections ở trạng thái đó

### 2. Cache Hit %
**Mô tả:** Tỷ lệ phần trăm các lần đọc dữ liệu từ shared_buffers (cache) so với tổng số lần đọc. Giá trị cao (>95%) cho thấy database đang hoạt động tốt, giá trị thấp (<90%) cảnh báo thiếu RAM hoặc cần tăng shared_buffers. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `cacheHitPercent` (number): Tỷ lệ cache hit (%), tính = `blks_hit / (blks_hit + blks_read) * 100`

### 3. Long-running Queries
**Mô tả:** Danh sách các queries đang chạy lâu hơn ngưỡng chỉ định (minSec, mặc định 60 giây). Giúp phát hiện queries chậm, có thể cần tối ưu hoặc kill. **Nguồn:** `pg_stat_activity`  
**Các trường:**
- `pid` (number): Process ID của session đang chạy query
- `user` (string): Username thực thi query
- `db` (string): Tên database
- `state` (string): Trạng thái query (thường là `active`)
- `durationSec` (number): Thời gian query đã chạy (giây)
- `startedAt` (string, optional): Thời điểm bắt đầu query (ISO format)
- `query` (string, optional): Nội dung query (có thể bị truncate)
- `app` (string, optional): Application name (ví dụ: "psql", "pgAdmin")

### 4. Deadlocks
**Mô tả:** Số lượng deadlocks xảy ra theo từng database. Deadlock xảy ra khi 2+ transactions chờ nhau, PostgreSQL tự động rollback một trong số đó. Số lượng > 0 cần điều tra. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `datname` (string): Tên database
- `deadlocks` (number): Số lượng deadlocks đã xảy ra (từ lúc stats_reset)

### 5. Current Locks by Mode
**Mô tả:** Thống kê các locks hiện tại đang tồn tại trong hệ thống, nhóm theo lock mode. Giúp hiểu loại locks nào đang được sử dụng nhiều. **Nguồn:** `pg_locks`  
**Các trường:**
- `mode` (string): Loại lock mode - `AccessShareLock`, `RowShareLock`, `RowExclusiveLock`, `ShareUpdateExclusiveLock`, `ShareLock`, `ShareRowExclusiveLock`, `ExclusiveLock`, `AccessExclusiveLock`
- `count` (number): Số lượng locks ở mode đó

### 5b. Lock Summary
**Mô tả:** Tổng hợp locks theo mode, phân biệt giữa locks đã được cấp phát (granted) và locks đang chờ (waiting). Locks đang chờ (>0) cho thấy có blocking. **Nguồn:** `pg_locks`  
**Các trường:**
- `mode` (string): Loại lock mode
- `granted` (number): Số lượng locks đã được cấp phát (granted = true)
- `waiting` (number): Số lượng locks đang chờ (granted = false) - ⚠ cảnh báo nếu > 0

### 6. Autovacuum & Dead Tuples
**Mô tả:** Top 10 bảng có nhiều dead tuples nhất, kèm thông tin về lần autovacuum/vacuum cuối cùng. Dead tuples tích tụ làm chậm queries và tốn dung lượng. **Nguồn:** `pg_stat_user_tables`  
**Các trường:**
- `relname` (string): Tên bảng
- `n_live_tup` (number): Số tuples còn sống (live tuples)
- `n_dead_tup` (number): Số tuples đã chết (dead tuples) - cần được vacuum
- `last_autovacuum` (string, optional): Thời điểm autovacuum cuối cùng (ISO format)
- `last_vacuum` (string, optional): Thời điểm vacuum thủ công cuối cùng (ISO format)

### 7. Index Usage
**Mô tả:** Top 10 bảng có tỷ lệ sử dụng index thấp nhất (idx_usage < 50%). Bảng có nhiều sequential scan hơn index scan thường cần thêm index hoặc tối ưu queries. **Nguồn:** `pg_stat_user_tables`  
**Các trường:**
- `relname` (string): Tên bảng
- `idx_scan` (number): Số lần scan bằng index
- `seq_scan` (number): Số lần scan tuần tự (sequential scan - đọc toàn bộ bảng)
- `idx_usage` (number, %): Tỷ lệ sử dụng index = `idx_scan / (idx_scan + seq_scan) * 100` - ⚠ cảnh báo nếu < 50%

### 8. Temp Files / Sort Spill
**Mô tả:** Thống kê temp files và temp bytes theo database. Temp files được tạo khi query cần sort/hash nhưng không đủ work_mem, gây I/O chậm. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `datname` (string): Tên database
- `temp_files` (number): Số lượng temp files đã tạo (từ lúc stats_reset)
- `temp_bytes` (number): Tổng dung lượng temp files (bytes)

### 9. Database Sizes
**Mô tả:** Kích thước của các database, dùng để theo dõi tăng trưởng dung lượng theo thời gian. **Nguồn:** `pg_database`  
**Các trường:**
- `datname` (string): Tên database
- `size` (string): Kích thước database (human-readable, ví dụ: "2.5 GB")

### 10. Connection Usage
**Mô tả:** So sánh số kết nối hiện tại với ngưỡng tối đa (max_connections). Tỷ lệ sử dụng >80% cảnh báo có thể hết connections. **Nguồn:** `pg_stat_activity`, `pg_settings`  
**Các trường:**
- `current_connections` (number): Số kết nối hiện tại
- `max_connections` (number): Số kết nối tối đa (từ setting max_connections)
- `used_percent` (number): Tỷ lệ sử dụng (%) = `current_connections / max_connections * 100` - ⚠ High nếu > 80% (đỏ nếu > 90%)

### 11. Wait Events (top 20)
**Mô tả:** Top 20 sessions đang chờ (waiting) với thông tin về loại wait event. Giúp xác định nguyên nhân chậm: I/O, Lock, CPU, v.v. **Nguồn:** `pg_stat_activity`  
**Các trường:**
- `pid` (number): Process ID
- `usename` (string): Username
- `datname` (string): Database name
- `state` (string): Trạng thái session
- `wait_event_type` (string): Loại wait event - `IO`, `Lock`, `LWLock`, `Activity`, `Extension`, `Client`, `IPC`, `Timeout`, `CPU`
- `wait_event` (string): Tên wait event cụ thể (ví dụ: `DataFileRead`, `BufferPin`)
- `duration` (string): Thời gian đã chờ (interval format)
- `sample_query` (string, optional): Query mẫu (truncate 200 ký tự)

### 12. Blocked Sessions (top 20)
**Mô tả:** Top 20 sessions bị block do lock conflict. Hiển thị session bị block và session đang block, cùng queries của chúng. **Nguồn:** `pg_locks`, `pg_stat_activity`  
**Các trường:**
- `blocked_pid` (number): Process ID của session bị block
- `blocked_user` (string): Username của session bị block
- `blocked_query` (string): Query của session bị block
- `blocking_pid` (number): Process ID của session đang block
- `blocking_user` (string): Username của session đang block
- `blocking_query` (string): Query của session đang block
- `blocked_state` (string): Trạng thái của session bị block
- `blocking_state` (string): Trạng thái của session đang block
- `blocked_duration` (string): Thời gian bị block (interval format)

### 13. Sequential vs Index Scans
**Mô tả:** Top 20 bảng có nhiều sequential scan nhất, so sánh với index scan. Sequential scan nhiều hơn index scan cho thấy cần thêm index. **Nguồn:** `pg_stat_user_tables`  
**Các trường:**
- `schemaname` (string): Tên schema
- `relname` (string): Tên bảng
- `seq_scan` (number): Số lần sequential scan
- `idx_scan` (number): Số lần index scan
- `idx_usage_percent` (number): Tỷ lệ sử dụng index (%) = `idx_scan / (seq_scan + idx_scan) * 100` - ⚠ Low nếu < 50%
- `n_live_tup` (number): Số live tuples trong bảng

### 14. Largest Table/Index Sizes
**Mô tả:** Top 10 bảng lớn nhất (tính cả index). Giúp xác định bảng nào chiếm nhiều dung lượng nhất. **Nguồn:** `pg_statio_user_tables`  
**Các trường:**
- `schemaname` (string): Tên schema
- `relname` (string): Tên bảng
- `total_size` (string): Tổng kích thước (table + index, human-readable, ví dụ: "500 MB")
- `table_size` (string): Kích thước bảng (human-readable)
- `index_size` (string): Kích thước index (human-readable)

### 14c. Dead Tuples & Autovacuum Count
**Mô tả:** Top 20 bảng có phần trăm dead tuples cao nhất, kèm số lần autovacuum/vacuum. Dead % >50% cảnh báo cần vacuum ngay. **Nguồn:** `pg_stat_user_tables`  
**Các trường:**
- `schema` (string): Tên schema
- `table` (string): Tên bảng
- `dead_percent` (number): Phần trăm dead tuples = `n_dead_tup / (n_live_tup + n_dead_tup) * 100` - ⚠ High nếu > 50%
- `autovacuum_count` (number): Số lần autovacuum đã chạy (từ lúc stats_reset)
- `vacuum_count` (number): Số lần vacuum thủ công đã chạy (từ lúc stats_reset)

### 15. Active vs Waiting Sessions
**Mô tả:** Đếm số session đang active, đang chờ (waiting), và idle trong database hiện tại. Waiting sessions >0 cho thấy có blocking. **Nguồn:** `pg_stat_activity`  
**Các trường:**
- `active_sessions` (number): Số session đang active (state = 'active')
- `waiting_sessions` (number): Số session đang chờ (wait_event_type IS NOT NULL) - ⚠ cảnh báo nếu > 0
- `idle_sessions` (number): Số session idle (state = 'idle')
- `total_sessions` (number): Tổng số sessions

### 16. Oldest Idle-in-Transaction
**Mô tả:** Top 10 sessions idle in transaction lâu nhất. Idle in transaction giữ locks, có thể gây block các sessions khác. **Nguồn:** `pg_stat_activity`  
**Các trường:**
- `database` (string): Tên database
- `pid` (number): Process ID
- `user` (string): Username
- `state` (string): Trạng thái (thường là 'idle in transaction')
- `idle_duration` (string): Thời gian idle (từ xact_start, interval format)
- `current_query` (string, optional): Query hiện tại (thường là query cuối cùng trước khi idle)

### 17. TPS & Rollback Rate
**Mô tả:** Tính số transaction commit và rollback mỗi giây (TPS) cùng phần trăm rollback theo database. Rollback % >5% cảnh báo có vấn đề với transactions. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `database` (string): Tên database
- `xact_commit` (number): Số transaction commit (từ lúc stats_reset)
- `xact_rollback` (number): Số transaction rollback (từ lúc stats_reset)
- `tps` (number): Transactions per second = `(xact_commit + xact_rollback) / (now() - stats_reset)`
- `rollback_pct` (number): Phần trăm rollback = `xact_rollback / (xact_commit + xact_rollback) * 100` - ⚠ cảnh báo nếu > 5%
- `stats_reset` (string): Thời điểm stats được reset (timestamp)

### 18. Per-DB Cache Hit %
**Mô tả:** Cache hit percentage theo từng database. Giá trị <95% cảnh báo thiếu RAM hoặc cần tăng shared_buffers cho database đó. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `database` (string): Tên database
- `cache_hit_pct` (number): Cache hit percentage = `blks_hit / (blks_hit + blks_read) * 100` - ⚠ Low nếu < 95%
- `blks_hit` (number): Số blocks đọc từ shared_buffers (cache)
- `blks_read` (number): Số blocks đọc từ disk

### 19. Wait by Lock Mode
**Mô tả:** Phân phối locks đang chờ (waiting) và đang giữ (held) theo lock type và mode. Giúp hiểu loại locks nào đang gây blocking. **Nguồn:** `pg_locks`  
**Các trường:**
- `locktype` (string): Loại lock - `relation`, `transactionid`, `virtualxid`, `tuple`, `object`, `page`, `key`, `advisory`
- `mode` (string): Lock mode (AccessShareLock, RowExclusiveLock, v.v.)
- `waiting` (number): Số lượng locks đang chờ (granted = false) - ⚠ cảnh báo nếu > 0
- `held` (number): Số lượng locks đang giữ (granted = true)

### 20. Lock Overview per Database
**Mô tả:** Tổng quan locks theo từng database, phân biệt waiting locks và held locks. Giúp xác định database nào đang có vấn đề về locking. **Nguồn:** `pg_stat_activity`, `pg_locks`  
**Các trường:**
- `database` (string): Tên database
- `waiting_locks` (number): Số lượng locks đang chờ - ⚠ cảnh báo nếu > 0
- `held_locks` (number): Số lượng locks đang giữ
- `total_locks` (number): Tổng số locks (waiting + held)

### 21. WAL Throughput (PG13+)
**Mô tả:** Thống kê Write-Ahead Logging (WAL) throughput. WAL là cơ chế đảm bảo tính nhất quán dữ liệu, ghi mọi thay đổi vào log trước khi commit. **Nguồn:** `pg_stat_wal` (PostgreSQL 13+)  
**Các trường:**
- `wal_records` (number): Số lượng WAL records đã ghi (từ lúc stats_reset)
- `wal_fpi` (number): Số lượng full page images (FPI) - khi page được ghi toàn bộ thay vì chỉ thay đổi
- `wal_bytes` (number): Tổng dung lượng WAL đã ghi (bytes, từ lúc stats_reset)
- `wal_bytes_per_sec` (number): Tốc độ ghi WAL (bytes/giây) = `wal_bytes / (now() - stats_reset)`
- `stats_reset` (string): Thời điểm stats được reset (ISO format)

### 22. Checkpoints & bgwriter
**Mô tả:** Thống kê về checkpoints và background writer. Checkpoint là quá trình ghi tất cả dirty pages từ shared_buffers ra disk để đảm bảo tính nhất quán. **Nguồn:** `pg_stat_checkpointer`  
**Các trường:**
- `num_timed` (number): Số checkpoint theo lịch (timeout, từ checkpoint_timeout setting)
- `num_requested` (number): Số checkpoint được yêu cầu (từ max_wal_size hoặc manual)
- `num_done` (number): Tổng số checkpoint đã thực hiện (timed + requested)
- `write_time` (number): Tổng thời gian I/O write trong checkpoint (milliseconds)
- `sync_time` (number): Tổng thời gian I/O sync trong checkpoint (milliseconds)
- `buffers_written` (number): Số buffers đã ghi trong checkpoint
- `slru_written` (number): Số SLRU (Subtransaction Log) buffers đã ghi
- `stats_reset` (string): Thời điểm stats được reset (ISO format)

### 23. Temp Files / Bytes per DB
**Mô tả:** Thống kê temp files và temp bytes theo database. Temp files được tạo khi query cần sort/hash nhưng không đủ work_mem, gây I/O chậm. **Nguồn:** `pg_stat_database`  
**Các trường:**
- `datname` (string): Tên database
- `temp_files` (number): Số lượng temp files đã tạo (từ lúc stats_reset) - ⚠ cảnh báo nếu > 0
- `temp_bytes` (number): Tổng dung lượng temp files (bytes, từ lúc stats_reset) - ⚠ cảnh báo nếu > 0

### 24. Database Sizes
**Mô tả:** Kích thước của các database, dùng để đối chiếu tăng trưởng theo thời gian. **Nguồn:** `pg_database`  
**Các trường:**
- `datname` (string): Tên database
- `size` (string): Kích thước database (human-readable, ví dụ: "2.5 GB")

---

## ⚠️ Cảnh Báo Tự Động

Dashboard tự động hiển thị cảnh báo (⚠) cho các metrics sau:
- **Connection Usage**: ⚠ High nếu `used_percent > 80%` (đỏ nếu >90%)
- **Cache Hit %**: ⚠ Low nếu < 95% (đỏ nếu <90%)
- **Index Usage**: ⚠ Low nếu `idx_usage < 50%`
- **Lock Summary**: ⚠ Waiting nếu `waiting > 0`
- **Blocked Sessions**: ⚠ High nếu có blocked sessions
- **Wait by Lock Mode**: ⚠ Waiting nếu `waiting > 0`
- **Lock Overview per DB**: ⚠ Waiting nếu `waiting_locks > 0`
- **Active vs Waiting Sessions**: ⚠ nếu `waiting_sessions > 0`
- **TPS & Rollback Rate**: ⚠ nếu `rollback_pct > 5%`
- **Per-DB Cache Hit %**: ⚠ Low nếu `cache_hit_pct < 95%`
- **Dead Tuples**: ⚠ High nếu `dead_percent > 50%`
- **Temp Files**: ⚠ nếu `temp_files > 0`

---

## 🗑️ Metrics Đã Xóa (8 metrics)

Đã loại bỏ để đơn giản hóa dashboard: Replication Lag, Temp IO, Autovacuum Activity (Detailed), Blocking Details, Running Vacuum Processes, Freeze Age Risk, Bloat Estimation, Performance Settings.

---

## 📌 Lưu Ý

- Tất cả 24 metrics này được sử dụng bởi **Problem Analyzer** để phát hiện vấn đề (24 rules)
- Metrics có cảnh báo (⚠) thường liên quan đến các rules trong Problem Analyzer
- File implementation: `server/src/utils/metricsCollector.ts` - thu thập tất cả 24 metrics
