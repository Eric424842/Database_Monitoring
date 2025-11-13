# Problem Analyzer - Hướng Dẫn Ngắn Gọn

> 📖 **Tài liệu này** gộp nội dung từ `TRIGGER_IMPLEMENTATION.md` và `PROBLEM_ANALYZER_RULES.md` thành một file ngắn gọn, dễ hiểu.

## 🎯 Trigger Là Gì?

**"Trigger"** trong Problem Analyzer = **"Điều kiện được thỏa mãn"** → **"Tạo Problem"** → **"Hiển thị trên UI"**

### So Sánh Nhanh

| Khía Cạnh | Trigger (Problem Analyzer) | Database Trigger (PostgreSQL) |
|-----------|---------------------------|-------------------------------|
| **Vị trí** | Code TypeScript (Node.js) | Database server (PostgreSQL) |
| **Kích hoạt** | Khi gọi API `/api/problems`, điều kiện TRUE | Tự động khi có event (INSERT/UPDATE/DELETE) |
| **Mục đích** | Phát hiện và báo cáo vấn đề | Tự động thực hiện hành động |
| **Ví dụ** | `if (waiting_sessions > 0) { createProblem() }` | `CREATE TRIGGER ... BEFORE UPDATE ...` |

### Ví Dụ Đơn Giản

```typescript
// Rule 2: Waiting Sessions
if (waiting_sessions > 0) {  // ✅ Điều kiện TRUE → TRIGGER!
  this.problems.push({
    id: "waiting-sessions",
    title: "Có Sessions Đang Chờ",
    // ...
  });
}
// → Tạo Problem → Hiển thị trên UI
```

**Kết quả:**
- ✅ **TRIGGER** = Điều kiện TRUE → Tạo Problem → Hiển thị UI
- ❌ **KHÔNG TRIGGER** = Điều kiện FALSE → Không có Problem → Không hiển thị

---

## 📊 Tổng Quan

- **Tổng số rules**: 24 rules
- **Tổng số metrics**: 24 metrics
- **Status**: ✅ Tất cả 24 rules đã có code trigger đầy đủ

### Phân Loại Rules

| Path | Số Rules | File | Rules |
|------|----------|------|-------|
| **Neutral** | 3 | `analyzer/problemAnalyzer.ts` | 1, 2, 12 |
| **Read-Path** | 7 | `analyzer/problemRules.read.ts` | 3, 4, 10, 11, 11b, 13, 18 |
| **Write-Path** | 14 | `analyzer/problemRules.write.ts` | 2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b |
| **Tổng** | **24** | 3 files | Tất cả rules |

### Mức Độ Ưu Tiên

- **High**: Vấn đề nghiêm trọng, cần xử lý ngay
- **Medium**: Vấn đề cần chú ý, nên xử lý sớm
- **Low**: Vấn đề thông tin, có thể xử lý sau

---

## 📋 Bảng Tóm Tắt Tất Cả 24 Rules

### 🔌 Connection Issues (3 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **1** | `connection-usage-high` | `used_percent > 80%` | High/Medium | Connection |
| **2** | `waiting-sessions` | `waiting_sessions > 0` (và không có blocked/I/O waits) | High | Connection |
| **2b** | `idle-in-transaction` | `idle_in_transaction > 5` | High | Transaction |

### 💾 Cache Issues (2 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **3** | `cache-hit-low` | `cacheHitPercent < 95%` | High/Medium | Cache |
| **4** | `cache-hit-low-per-db` | Có DB có `cache_hit_pct < 95%` | High/Medium | Cache |

### 🔒 Locking Issues (6 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **5** | `deadlocks-detected` | `totalDeadlocks > 0` | High | Locking |
| **6** | `locks-waiting` | Có lock mode có `waiting > 0` | High | Locking |
| **7** | `blocked-sessions` | `blockedSessions.length > 0` | High | Locking |
| **8** | `locks-waiting-by-mode` | Có lock mode có `waiting > 0` | High | Locking |
| **9** | `locks-waiting-per-db` | Có DB có `waiting_locks > 0` | High | Locking |
| **9b** | `total-locks-high` | `totalLocks > 1000` | Medium | Locking |

### ⚡ Performance Issues (3 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **10** | `index-usage-low` | Có bảng có `idx_usage < 50%` | Medium | Performance |
| **11** | `sequential-scans-high` | Có bảng có `seq_scan > 1000` và `idx_usage < 50%` | Medium | Performance |
| **11b** | `table-size-large` | Có bảng có `total_size > 10GB` | Low | Performance |

### 👥 Session Issues (4 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **12** | `long-running-queries` | Có query chạy > 30s (hoặc > 5 phút) | High/Medium | Query |
| **13** | `io-wait-events` | Có session có `wait_event_type = "IO"` | High | I/O |
| **14** | `oldest-idle-transaction` | Có transaction idle > 1 giờ | High | Transaction |
| **15** | `rollback-rate-high` | Có DB có `rollback_pct > 5%` | Medium | Transaction |

### 🧹 Maintenance Issues (2 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **16** | `dead-tuples-high` | Có bảng có `dead_percent > 20%` | Medium | Maintenance |
| **17** | `autovacuum-not-recent` | Có bảng chưa có autovacuum trong > 7 ngày | Medium | Maintenance |

### 📁 I/O Issues (4 rules)

| Rule | ID | Điều Kiện Trigger | Priority | Category |
|------|----|-------------------|----------|----------|
| **18** | `temp-files-detected` | Có DB có `temp_files > 0` | Medium | I/O |
| **19** | `wal-throughput-high` | `wal_bytes_per_sec > 100MB/s` | Medium | I/O |
| **20** | `checkpoints-frequent` | `num_timed > 10` trong 1 giờ | Medium | I/O |
| **20b** | `database-size-large` | Có DB có `size > 100GB` | Low | I/O |

---

## 🔍 Chi Tiết Từng Rule

### Rule 1: Connection Usage Quá Cao

**🔍 Điều kiện trigger:**
- `connectionUsage.used_percent > 80%`
- **Ngưỡng cảnh báo**: Medium (80-90%), High (>90%)

**💡 Ý nghĩa:**
- Kiểm tra số lượng connections đang sử dụng có gần đạt giới hạn không
- Nếu > 80%: Cần xem xét tăng `max_connections` hoặc tối ưu connection pooling
- Nếu > 90%: Cần xử lý ngay, có nguy cơ hết connections

**🔧 Hành động khuyến nghị:**
- Tăng `max_connections` trong PostgreSQL config
- Tối ưu connection pooling (giảm số connections không cần thiết)
- Kiểm tra và đóng các connections không sử dụng

---

### Rule 2: Có Sessions Đang Chờ

**🔍 Điều kiện trigger:**
- `waiting_sessions > 0`
- **VÀ** không có blocked sessions (Rule 7 sẽ xử lý)
- **VÀ** không có I/O wait events (Rule 13 sẽ xử lý)
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các sessions đang chờ (waiting) - có thể do lock hoặc I/O
- Rule này chỉ trigger khi **KHÔNG có** blocked sessions hoặc I/O wait events (để tránh duplicate)
- **Path**: Neutral (vấn đề trung tính)

**🔧 Hành động khuyến nghị:**
- Kiểm tra Wait Events để xác định nguyên nhân
- Kiểm tra Blocked Sessions
- Xem xét các queries đang chạy lâu

---

### Rule 2b: Quá Nhiều Idle in Transaction

**🔍 Điều kiện trigger:**
- `idle_in_transaction > 5` connections
- **Ngưỡng cảnh báo**: High (> 5 connections)

**💡 Ý nghĩa:**
- Phát hiện các connections đang ở trạng thái "idle in transaction"
- Các connections này có thể đang giữ lock, gây ảnh hưởng đến performance
- **Path**: Write-Path (liên quan đến transaction và locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra và kill các idle transactions
- Thiết lập `idle_in_transaction_session_timeout` để tự động đóng các transactions idle quá lâu

---

### Rule 3: Cache Hit Percentage Thấp (Tổng thể)

**🔍 Điều kiện trigger:**
- `cacheHitPercent < 95%`
- **Ngưỡng cảnh báo**: Medium (90-95%), High (<90%)

**💡 Ý nghĩa:**
- Cache hit percentage cho biết tỷ lệ dữ liệu được đọc từ memory (cache) thay vì disk
- < 95%: Database đang đọc nhiều từ disk → chậm hơn
- < 90%: Vấn đề nghiêm trọng, cần xử lý ngay
- **Path**: Read-Path (liên quan đến đọc dữ liệu từ cache)

**🔧 Hành động khuyến nghị:**
- Tăng `shared_buffers` trong PostgreSQL config
- Kiểm tra workload và xem xét tăng RAM
- Tối ưu queries để tăng cache hit

---

### Rule 4: Cache Hit Thấp Theo Database

**🔍 Điều kiện trigger:**
- Có ít nhất 1 database có `cache_hit_pct < 95%`
- **Ngưỡng cảnh báo**: Medium (90-95%), High (<90%)

**💡 Ý nghĩa:**
- Phát hiện các database cụ thể có cache hit thấp
- Giúp xác định database nào cần được tối ưu
- **Path**: Read-Path (liên quan đến đọc dữ liệu từ cache)

**🔧 Hành động khuyến nghị:**
- Kiểm tra workload của các database có cache hit thấp
- Xem xét tăng `shared_buffers`
- Tối ưu queries của các database đó

---

### Rule 5: Phát Hiện Deadlocks

**🔍 Điều kiện trigger:**
- `totalDeadlocks > 0` (tổng số deadlocks từ tất cả databases)
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Deadlock xảy ra khi 2+ transactions đang chờ nhau, không thể tiếp tục
- PostgreSQL tự động rollback một trong các transactions, nhưng vẫn là vấn đề nghiêm trọng
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra và tối ưu các transactions có thể gây deadlock
- Xem xét thứ tự lock (luôn lock theo cùng một thứ tự)
- Thiết lập timeout cho transactions

---

### Rule 6: Có Locks Đang Chờ

**🔍 Điều kiện trigger:**
- Có ít nhất 1 lock mode có `waiting > 0`
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các locks đang chờ (waiting) - chưa được grant
- Có thể gây blocking và làm chậm queries
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra Blocked Sessions
- Xem xét các queries đang giữ lock quá lâu
- Tối ưu transaction duration

---

### Rule 7: Có Sessions Bị Block

**🔍 Điều kiện trigger:**
- `blockedSessions.length > 0`
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các sessions đang bị block bởi lock từ sessions khác
- Nếu Rule 7 trigger, Rule 2 sẽ **KHÔNG trigger** (để tránh duplicate)
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra blocking queries
- Xem xét kill các long-running transactions đang giữ lock
- Tối ưu queries để giảm lock duration

---

### Rule 8: Locks Đang Chờ Theo Mode

**🔍 Điều kiện trigger:**
- Có ít nhất 1 lock mode có `waiting > 0`
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phân tích locks đang chờ theo từng lock mode (AccessShareLock, ExclusiveLock, v.v.)
- Giúp xác định loại lock nào đang gây vấn đề
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Phân tích lock mode để xác định loại lock đang gây vấn đề
- Tối ưu queries sử dụng các lock modes đó

---

### Rule 9: Locks Đang Chờ Theo Database

**🔍 Điều kiện trigger:**
- Có ít nhất 1 database có `waiting_locks > 0`
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các database cụ thể có locks đang chờ
- Giúp xác định database nào đang gặp vấn đề về locking
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra các database có waiting locks
- Xác định nguyên nhân và tối ưu

---

### Rule 9b: Tổng Số Locks Quá Cao

**🔍 Điều kiện trigger:**
- `totalLocks > 1000`
- **Ngưỡng cảnh báo**: Medium (> 1000 locks)

**💡 Ý nghĩa:**
- Phát hiện khi tổng số locks đang active quá cao
- Có thể do các transactions đang giữ quá nhiều locks
- **Path**: Write-Path (liên quan đến locking)

**🔧 Hành động khuyến nghị:**
- Kiểm tra các transactions đang giữ nhiều locks
- Xem xét tối ưu transaction size
- Giảm số lượng rows được lock trong một transaction

---

### Rule 10: Index Usage Thấp

**🔍 Điều kiện trigger:**
- Có ít nhất 1 bảng có `idx_usage < 50%`
- **Ngưỡng cảnh báo**: Medium (< 50%)

**💡 Ý nghĩa:**
- Phát hiện các bảng có tỷ lệ sử dụng index thấp (nhiều sequential scans)
- Sequential scans chậm hơn index scans, đặc biệt với bảng lớn
- **Path**: Read-Path (liên quan đến đọc dữ liệu)

**🔧 Hành động khuyến nghị:**
- Thêm index cho các cột thường được query
- Tối ưu queries để sử dụng index
- Xem xét sử dụng `EXPLAIN ANALYZE` để phân tích query plan

---

### Rule 11: Sequential Scan Quá Nhiều

**🔍 Điều kiện trigger:**
- Có ít nhất 1 bảng có `seq_scan > 1000` **VÀ** `idx_usage < 50%`
- **Ngưỡng cảnh báo**: Medium (seq_scan > 1000 và idx_usage < 50%)

**💡 Ý nghĩa:**
- Phát hiện các bảng đang có quá nhiều sequential scans
- Sequential scans đọc toàn bộ bảng, rất chậm với bảng lớn
- **Path**: Read-Path (liên quan đến đọc dữ liệu)

**🔧 Hành động khuyến nghị:**
- Thêm index cho các cột thường query
- Tối ưu queries để sử dụng index thay vì sequential scan
- Xem xét sử dụng partial indexes nếu cần

---

### Rule 11b: Bảng/Index Quá Lớn

**🔍 Điều kiện trigger:**
- Có ít nhất 1 bảng có `total_size > 10GB`
- **Ngưỡng cảnh báo**: Low (> 10GB)

**💡 Ý nghĩa:**
- Phát hiện các bảng hoặc index quá lớn
- Bảng lớn có thể gây vấn đề về performance và storage
- **Path**: Read-Path (liên quan đến đọc dữ liệu)

**🔧 Hành động khuyến nghị:**
- Xem xét partitioning cho bảng lớn
- Archive dữ liệu cũ không còn sử dụng
- Xem xét compression hoặc tối ưu storage

---

### Rule 12: Long-running Queries

**🔍 Điều kiện trigger:**
- Có query chạy > 30 giây (Medium)
- Có query chạy > 5 phút (High)
- **Ngưỡng cảnh báo**: Medium (>30s), High (>5 phút)

**💡 Ý nghĩa:**
- Phát hiện các queries chạy quá lâu
- Queries chạy lâu có thể block resources và làm chậm database
- **Path**: Neutral (vấn đề trung tính)

**🔧 Hành động khuyến nghị:**
- Kiểm tra và tối ưu các queries chạy lâu
- Xem xét thêm index hoặc tối ưu query plan
- Sử dụng `EXPLAIN ANALYZE` để phân tích

---

### Rule 13: Có Sessions Đang Chờ I/O

**🔍 Điều kiện trigger:**
- Có ít nhất 1 session có `wait_event_type = "IO"`
- **Ngưỡng cảnh báo**: High (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các sessions đang chờ I/O operations
- I/O waits cho thấy database đang đọc/ghi từ disk nhiều
- **Path**: Read-Path (liên quan đến I/O read)

**🔧 Hành động khuyến nghị:**
- Kiểm tra I/O subsystem (disk performance)
- Tối ưu queries để giảm I/O
- Xem xét tăng cache (shared_buffers)

---

### Rule 14: Có Transactions Idle Quá Lâu

**🔍 Điều kiện trigger:**
- Có ít nhất 1 transaction idle > 1 giờ
- **Ngưỡng cảnh báo**: High (> 1 giờ)

**💡 Ý nghĩa:**
- Phát hiện các transactions đang idle quá lâu
- Idle transactions có thể đang giữ lock, gây blocking
- **Path**: Write-Path (liên quan đến transaction)

**🔧 Hành động khuyến nghị:**
- Kill các idle transactions
- Thiết lập `idle_in_transaction_session_timeout`
- Kiểm tra application code để đảm bảo transactions được commit/rollback đúng cách

---

### Rule 15: Tỷ Lệ Rollback Cao

**🔍 Điều kiện trigger:**
- Có ít nhất 1 database có `rollback_pct > 5%`
- **Ngưỡng cảnh báo**: Medium (> 5%)

**💡 Ý nghĩa:**
- Phát hiện các database có tỷ lệ rollback cao
- Rollback cao có thể do application logic có vấn đề hoặc xử lý lỗi không đúng
- **Path**: Write-Path (liên quan đến transaction)

**🔧 Hành động khuyến nghị:**
- Kiểm tra application logic và xử lý lỗi
- Xem xét transaction handling trong code
- Kiểm tra các queries thường xuyên bị rollback

---

### Rule 16: Dead Tuples Quá Nhiều

**🔍 Điều kiện trigger:**
- Có ít nhất 1 bảng có `dead_percent > 20%`
- **Ngưỡng cảnh báo**: Medium (> 20%)

**💡 Ý nghĩa:**
- Phát hiện các bảng có quá nhiều dead tuples (rows đã bị xóa hoặc update)
- Dead tuples chiếm không gian và làm chậm queries
- **Path**: Write-Path (liên quan đến maintenance)

**🔧 Hành động khuyến nghị:**
- Chạy VACUUM để dọn dẹp dead tuples
- Tối ưu autovacuum settings
- Xem xét chạy VACUUM FULL nếu cần (cẩn thận với downtime)

---

### Rule 17: Autovacuum Chưa Chạy Lâu

**🔍 Điều kiện trigger:**
- Có ít nhất 1 bảng chưa có autovacuum trong > 7 ngày
- **Ngưỡng cảnh báo**: Medium (> 7 ngày)

**💡 Ý nghĩa:**
- Phát hiện các bảng chưa được autovacuum trong thời gian dài
- Autovacuum cần chạy thường xuyên để dọn dẹp dead tuples
- **Path**: Write-Path (liên quan đến maintenance)

**🔧 Hành động khuyến nghị:**
- Chạy VACUUM thủ công cho các bảng đó
- Kiểm tra autovacuum settings và đảm bảo nó hoạt động
- Xem xét điều chỉnh `autovacuum_vacuum_scale_factor` và `autovacuum_vacuum_threshold`

---

### Rule 18: Phát Hiện Temp Files

**🔍 Điều kiện trigger:**
- Có ít nhất 1 database có `temp_files > 0`
- **Ngưỡng cảnh báo**: Medium (bất kỳ số lượng nào > 0)

**💡 Ý nghĩa:**
- Phát hiện các database đang tạo temp files (file tạm trên disk)
- Temp files được tạo khi queries cần nhiều memory hơn `work_mem`
- **Path**: Read-Path (liên quan đến I/O và memory)

**🔧 Hành động khuyến nghị:**
- Tăng `work_mem` để giảm temp files
- Tối ưu queries để giảm memory usage
- Xem xét tối ưu sorting và hashing operations

---

### Rule 19: WAL Throughput Cao

**🔍 Điều kiện trigger:**
- `wal_bytes_per_sec > 100MB/s`
- **Ngưỡng cảnh báo**: Medium (> 100MB/s)

**💡 Ý nghĩa:**
- Phát hiện WAL (Write-Ahead Log) throughput quá cao
- WAL throughput cao cho thấy write workload lớn
- **Path**: Write-Path (liên quan đến WAL và write operations)

**🔧 Hành động khuyến nghị:**
- Kiểm tra write workload và xem xét tối ưu
- Xem xét WAL archiving nếu cần
- Kiểm tra replication lag nếu có

---

### Rule 20: Checkpoints Quá Thường Xuyên

**🔍 Điều kiện trigger:**
- `num_timed > 10` checkpoints trong 1 giờ
- **Ngưỡng cảnh báo**: Medium (> 10 checkpoints/giờ)

**💡 Ý nghĩa:**
- Phát hiện checkpoints chạy quá thường xuyên
- Checkpoints thường xuyên có thể gây I/O spike và làm chậm database
- **Path**: Write-Path (liên quan đến checkpoints)

**🔧 Hành động khuyến nghị:**
- Tăng `checkpoint_timeout` để giảm tần suất checkpoints
- Tối ưu `max_wal_size` để kiểm soát WAL size
- Kiểm tra write workload

---

### Rule 20b: Database Quá Lớn

**🔍 Điều kiện trigger:**
- Có ít nhất 1 database có `size > 100GB`
- **Ngưỡng cảnh báo**: Low (> 100GB)

**💡 Ý nghĩa:**
- Phát hiện các database quá lớn
- Database lớn có thể gây vấn đề về backup, restore và performance
- **Path**: I/O (liên quan đến storage)

**🔧 Hành động khuyến nghị:**
- Xem xét partitioning cho các bảng lớn
- Archive dữ liệu cũ không còn sử dụng
- Xem xét compression hoặc tối ưu storage

---

## 🎯 Cách Sử Dụng

1. **Gọi API**: `GET /api/problems` → Trả về danh sách Problems (chỉ rules đã trigger)
2. **Xem Problems**: UI hiển thị Problems theo priority (High → Medium → Low)
3. **Xử lý**: Làm theo "Hành động khuyến nghị" của từng Problem

---

## ✅ Kết Luận

- ✅ **24/24 rules** đã có code trigger đầy đủ
- ✅ Mỗi rule có điều kiện trigger rõ ràng
- ✅ Tự động phát hiện vấn đề từ 24 metrics
- ✅ Chỉ hiển thị khi có vấn đề thật sự (trigger)

**File implementation:**
- `server/src/analyzer/problemAnalyzer.ts` - Orchestrator + Neutral rules (1, 2, 12)
- `server/src/analyzer/problemRules.read.ts` - Read-Path rules (3, 4, 10, 11, 11b, 13, 18)
- `server/src/analyzer/problemRules.write.ts` - Write-Path rules (2b, 5, 6, 7, 8, 9, 9b, 14, 15, 16, 17, 19, 20, 20b)

