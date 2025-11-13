# Problem Storage Guide - Hướng Dẫn Lưu Vấn Đề Xuống Database

> 📖 **Tài liệu liên quan:**
> - **[MONITORING_SETUP_AND_QUERIES.sql](./MONITORING_SETUP_AND_QUERIES.sql)** - SQL schema và queries đầy đủ
> - **[PROBLEM_ANALYZER_GUIDE.md](./PROBLEM_ANALYZER_GUIDE.md)** - Chi tiết về 24 rules phát hiện vấn đề, điều kiện trigger, và hành động khuyến nghị

## 📊 Tổng Quan

Problem Analyzer phát hiện vấn đề từ 24 metrics và có thể lưu vào PostgreSQL database để:
- **Theo dõi lịch sử**: Xem vấn đề đã xuất hiện khi nào, kéo dài bao lâu
- **Phân tích xu hướng**: Xem vấn đề nào thường xuyên xuất hiện
- **Auto-resolve**: Tự động resolve problems không còn tồn tại

---

## 🗄️ Cấu Trúc Database

### Bảng `monitoring.problems`

```sql
CREATE TABLE monitoring.problems (
  id               BIGSERIAL PRIMARY KEY,
  problem_id       VARCHAR(255) NOT NULL,  -- Ví dụ: "connection-usage-high"
  priority         monitoring.problem_priority NOT NULL,  -- High, Medium, Low
  category         monitoring.problem_category NOT NULL,  -- Connection, Performance, ...
  path             monitoring.problem_path NOT NULL,       -- read, write, neutral
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  action           TEXT NOT NULL,
  current_value    JSONB NOT NULL DEFAULT '{}'::jsonb,    -- Giá trị hiện tại
  threshold        JSONB NOT NULL DEFAULT '{}'::jsonb,     -- Ngưỡng cảnh báo
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  instance_label   VARCHAR(255),        -- "Production DB"
  connection_host  VARCHAR(255),        -- "localhost:5432"
  database_name    VARCHAR(255),        -- "mydb"
  status           monitoring.problem_status NOT NULL DEFAULT 'open',  -- open, resolved, suppressed
  first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- Lần đầu phát hiện
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),   -- Lần cuối phát hiện
  resolved_at      TIMESTAMPTZ,                          -- Khi nào được resolve
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Các trường quan trọng:**
- **`problem_id`**: ID duy nhất của rule (ví dụ: "connection-usage-high")
- **`first_seen_at`**: Lần đầu phát hiện (không thay đổi khi update)
- **`detected_at`**: Lần cuối phát hiện (cập nhật mỗi lần phát hiện lại)
- **`status`**: `open` (đang mở), `resolved` (đã xử lý), `suppressed` (tạm bỏ qua)

---

## 🔑 Tránh Duplicate - Partial Unique Index

### Vấn Đề

Mỗi `problem_id` + `database_name` + `instance_label` chỉ nên có **1 bản ghi `status='open'`** tại một thời điểm.

**Ví dụ:**
```
❌ KHÔNG ĐƯỢC: 2 bản ghi "open" cho cùng problem_id + database
✅ ĐÚNG: 1 bản ghi "open", nếu phát hiện lại → UPDATE bản ghi đó
```

### Giải Pháp

```sql
-- Partial unique index: chỉ áp dụng cho status='open'
CREATE UNIQUE INDEX uniq_open_problem_per_db
  ON monitoring.problems(problem_id, database_name, instance_label)
  WHERE status = 'open';
```

**Kết quả:**
- ✅ Chỉ có 1 bản ghi "open" cho mỗi problem_id + database + instance
- ✅ Có thể có nhiều bản ghi "resolved" cho cùng problem_id

---

## 💾 Cơ Chế UPSERT

### UPSERT Là Gì?

**UPSERT** = **UP**date + in**SERT** - Nếu đã có thì UPDATE, nếu chưa có thì INSERT.

### SQL UPSERT

```sql
INSERT INTO monitoring.problems
(problem_id, priority, category, path, title, message, action,
 current_value, threshold, metadata,
 instance_label, connection_host, database_name,
 status, detected_at)
VALUES
($1, $2::monitoring.problem_priority, $3::monitoring.problem_category, $4::monitoring.problem_path,
 $5, $6, $7,
 COALESCE($8::jsonb, '{}'::jsonb), COALESCE($9::jsonb, '{}'::jsonb), COALESCE($10::jsonb, '{}'::jsonb),
 $11, $12, $13,
 'open', $14::timestamptz)
ON CONFLICT (problem_id, database_name, instance_label)
WHERE status = 'open'
DO UPDATE SET
  priority      = EXCLUDED.priority,
  category      = EXCLUDED.category,
  path          = EXCLUDED.path,
  title         = EXCLUDED.title,
  message       = EXCLUDED.message,
  action        = EXCLUDED.action,
  current_value = EXCLUDED.current_value,
  threshold     = EXCLUDED.threshold,
  metadata      = EXCLUDED.metadata,
  detected_at   = EXCLUDED.detected_at,  -- Cập nhật thời gian phát hiện
  status        = 'open'
RETURNING id;
```

**Giải thích:**
1. **INSERT**: Thử INSERT bản ghi mới
2. **ON CONFLICT**: Nếu conflict với unique index (cùng problem_id + database + instance + status='open')
3. **DO UPDATE SET**: Cập nhật bản ghi cũ với giá trị mới
4. **RETURNING id**: Trả về ID của bản ghi (INSERT mới hoặc UPDATE cũ)

---

## 🔄 Ví Dụ Thực Tế

### Scenario 1: Lần Đầu Phát Hiện

**Tình huống:** Problem "connection-usage-high" chưa từng được phát hiện

**SQL:**
```sql
INSERT INTO monitoring.problems
(problem_id, title, message, current_value, database_name, status, detected_at)
VALUES
('connection-usage-high', 'Connection Usage Quá Cao', 
 'Connection usage đang ở 85.5%',
 '{"used_percent": 85.5}'::jsonb,
 'mydb', 'open', '2024-01-01 12:00:00+00'::timestamptz)
ON CONFLICT (problem_id, database_name, instance_label) WHERE status = 'open'
DO UPDATE SET ...;
```

**Kết quả:**
- ✅ **INSERT thành công** (không có conflict)
- Tạo bản ghi mới với `id = 1`, `first_seen_at = '2024-01-01 12:00:00'`

**Database:**
```
id | problem_id              | database_name | status | first_seen_at        | detected_at
---|-------------------------|---------------|--------|---------------------|-------------------
1  | connection-usage-high   | mydb          | open   | 2024-01-01 12:00:00 | 2024-01-01 12:00:00
```

---

### Scenario 2: Phát Hiện Lại Vấn Đề Đã Tồn Tại

**Tình huống:** 30 phút sau, vấn đề vẫn còn (hoặc tái xuất hiện)

**SQL:**
```sql
INSERT INTO monitoring.problems
(problem_id, title, message, current_value, database_name, status, detected_at)
VALUES
('connection-usage-high', 'Connection Usage Quá Cao',
 'Connection usage đang ở 90.2%',  -- Giá trị mới
 '{"used_percent": 90.2}'::jsonb,
 'mydb', 'open', '2024-01-01 12:30:00+00'::timestamptz)  -- Thời gian mới
ON CONFLICT (problem_id, database_name, instance_label) WHERE status = 'open'
DO UPDATE SET
  message       = EXCLUDED.message,        -- Cập nhật: "90.2%" thay vì "85.5%"
  current_value = EXCLUDED.current_value,  -- Cập nhật: {"used_percent": 90.2}
  detected_at   = EXCLUDED.detected_at,   -- Cập nhật: '2024-01-01 12:30:00'
  status        = 'open';
```

**Kết quả:**
- ⚠️ **CONFLICT** với bản ghi `id = 1`
- ✅ **DO UPDATE SET** được thực thi
- **Cập nhật:** `message`, `current_value`, `detected_at`
- **Giữ nguyên:** `id = 1`, `first_seen_at = '2024-01-01 12:00:00'`

**Database (sau UPDATE):**
```
id | problem_id              | database_name | status | first_seen_at        | detected_at          | updated_at
---|-------------------------|---------------|--------|---------------------|----------------------|-------------------
1  | connection-usage-high   | mydb          | open   | 2024-01-01 12:00:00 | 2024-01-01 12:30:00  | 2024-01-01 12:30:00
```

---

### Scenario 3: Vấn Đề Đã Resolve, Tái Xuất Hiện

**Tình huống:** Problem đã được resolve, nhưng 1 giờ sau lại xuất hiện

**Trạng thái ban đầu:**
```
id | problem_id              | status    | detected_at          | resolved_at
---|-------------------------|-----------|----------------------|-------------------
1  | connection-usage-high   | resolved  | 2024-01-01 12:30:00  | 2024-01-01 13:00:00
```

**SQL:**
```sql
INSERT INTO monitoring.problems
(problem_id, title, message, current_value, database_name, status, detected_at)
VALUES
('connection-usage-high', 'Connection Usage Quá Cao',
 'Connection usage đang ở 88.1%',
 '{"used_percent": 88.1}'::jsonb,
 'mydb', 'open', '2024-01-01 14:00:00+00'::timestamptz)
ON CONFLICT (problem_id, database_name, instance_label) WHERE status = 'open'
DO UPDATE SET ...;
```

**Kết quả:**
- ✅ **KHÔNG có conflict** (bản ghi cũ có `status = 'resolved'`, không phải `'open'`)
- ✅ **INSERT thành công** bản ghi mới
- Tạo bản ghi mới với `id = 2`, `first_seen_at = '2024-01-01 14:00:00'`

**Database:**
```
id | problem_id              | status    | first_seen_at        | detected_at          | resolved_at
---|-------------------------|-----------|---------------------|----------------------|-------------------
1  | connection-usage-high   | resolved  | 2024-01-01 12:00:00 | 2024-01-01 12:30:00  | 2024-01-01 13:00:00
2  | connection-usage-high   | open      | 2024-01-01 14:00:00 | 2024-01-01 14:00:00  | NULL
```

**Giải thích:**
- Có thể có nhiều bản ghi "resolved" cho cùng `problem_id`
- Chỉ có 1 bản ghi "open" tại một thời điểm
- Mỗi lần tái xuất hiện tạo bản ghi mới với `first_seen_at` mới

---

## 🔧 Trigger Tự Động

### Function `touch_updated_at()`

```sql
CREATE OR REPLACE FUNCTION monitoring.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Luôn cập nhật updated_at
  NEW.updated_at := now();
  
  -- Nếu status chuyển sang 'resolved' → tự động set resolved_at
  IF NEW.status = 'resolved'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at := now();
  END IF;
  
  -- Giữ nguyên first_seen_at khi update
  IF OLD.first_seen_at IS NOT NULL THEN
    NEW.first_seen_at := OLD.first_seen_at;
  END IF;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_problems_touch
BEFORE UPDATE ON monitoring.problems
FOR EACH ROW EXECUTE FUNCTION monitoring.touch_updated_at();
```

**Chức năng:**
1. Tự động cập nhật `updated_at` mỗi lần UPDATE
2. Tự động set `resolved_at` khi status chuyển từ `'open'` → `'resolved'`
3. Bảo vệ `first_seen_at` không bị thay đổi

**Ví dụ:**
```sql
-- UPDATE status từ 'open' → 'resolved'
UPDATE monitoring.problems
SET status = 'resolved'
WHERE id = 1;

-- Trigger tự động:
-- ✅ updated_at = now()
-- ✅ resolved_at = now()
-- ✅ first_seen_at giữ nguyên
```

---

## 📝 Code Backend

### Function `upsertProblem()`

```typescript
// server/src/repositories/problems.ts

export async function upsertProblem(
  client: PoolClient, 
  p: DetectedProblem, 
  ctx: ProblemContext
) {
  const sql = `
    INSERT INTO monitoring.problems
    (problem_id, priority, category, path, title, message, action,
     current_value, threshold, metadata,
     instance_label, connection_host, database_name,
     status, detected_at)
    VALUES
    ($1, $2::monitoring.problem_priority, $3::monitoring.problem_category, $4::monitoring.problem_path,
     $5, $6, $7,
     COALESCE($8::jsonb, '{}'::jsonb), COALESCE($9::jsonb, '{}'::jsonb), COALESCE($10::jsonb, '{}'::jsonb),
     $11, $12, $13,
     'open', $14::timestamptz)
    ON CONFLICT (problem_id, database_name, instance_label)
    WHERE status = 'open'
    DO UPDATE SET
      priority      = EXCLUDED.priority,
      category      = EXCLUDED.category,
      path          = EXCLUDED.path,
      title         = EXCLUDED.title,
      message       = EXCLUDED.message,
      action        = EXCLUDED.action,
      current_value = EXCLUDED.current_value,
      threshold     = EXCLUDED.threshold,
      metadata      = EXCLUDED.metadata,
      detected_at   = EXCLUDED.detected_at,
      status        = 'open'
    RETURNING id;
  `;

  const values = [
    p.id,                    // $1: problem_id
    p.priority,              // $2: priority
    p.category,              // $3: category
    p.path,                  // $4: path
    p.title,                 // $5: title
    p.message,               // $6: message
    p.action,                // $7: action
    p.currentValue ?? {},    // $8: current_value (JSONB)
    p.threshold ?? {},       // $9: threshold (JSONB)
    {},                      // $10: metadata (JSONB)
    ctx.instanceLabel ?? null,      // $11: instance_label
    ctx.connectionHost ?? null,     // $12: connection_host
    ctx.databaseName ?? null,       // $13: database_name
    p.detectedAt,            // $14: detected_at
  ];

  const result = await client.query(sql, values);
  return result.rows[0]?.id;  // Trả về id của problem
}
```

### Function `saveProblems()` - Lưu Nhiều Problems

```typescript
// server/src/repositories/problems.ts

export async function saveProblems(
  poolOrClient: Pool | PoolClient, 
  problems: (DetectedProblem | Problem)[], 
  ctx: ProblemContext
) {
  if (!problems?.length) {
    return; // Không có problems để lưu
  }

  // Phát hiện xem poolOrClient là Pool hay PoolClient
  // PoolClient có method release(), Pool có method connect()
  const isExternalClient = typeof (poolOrClient as any).release === 'function';
  const client = isExternalClient 
    ? poolOrClient as PoolClient  // Dùng client từ bên ngoài (từ scheduler)
    : await (poolOrClient as Pool).connect();  // Tạo client mới từ pool
  
  const shouldManageTransaction = !isExternalClient;  // Chỉ quản lý transaction nếu tạo client mới
  const shouldReleaseClient = !isExternalClient;     // Chỉ release nếu tạo client mới

  try {
    if (shouldManageTransaction) {
      await client.query("BEGIN");
    }
    
    // Lưu từng problem trong transaction
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p) continue; // Skip nếu undefined (không nên xảy ra)
      await upsertProblem(client, p, ctx);
    }
    
    if (shouldManageTransaction) {
      await client.query("COMMIT");
    }
  } catch (e) {
    if (shouldManageTransaction) {
      await client.query("ROLLBACK");
    }
    throw e;
  } finally {
    if (shouldReleaseClient) {
      client.release();
    }
  }
}
```

**Giải thích:**
- **Hỗ trợ cả Pool và PoolClient**: 
  - Nếu nhận `PoolClient` (từ scheduler): Dùng client đó, không tạo transaction riêng (đã có transaction từ scheduler)
  - Nếu nhận `Pool`: Tạo client mới, quản lý transaction riêng
- **Transaction**: Tất cả problems được lưu trong 1 transaction
- **Atomic**: Nếu 1 problem lỗi, tất cả đều rollback
- **Hiệu quả**: Tất cả INSERT/UPDATE trong 1 transaction nhanh hơn
- **Sử dụng trong Scheduler**: Scheduler truyền `PoolClient` vào `saveProblems()` để tất cả operations (collect metrics, analyze, save problems, resolve) nằm trong cùng 1 transaction

### Ví Dụ Sử Dụng Trong Scheduler

```typescript
// server/src/repositories/scheduler.ts

export async function runProblemScan(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");  // Bắt đầu transaction
    
    // 1. Thu thập metrics
    const analyzerInput = await collectMetricsForAnalyzer(client, 60);
    
    // 2. Phân tích problems
    const problems = analyzeProblems(analyzerInput);
    
    // 3. Lưu problems (dùng cùng client, không tạo transaction riêng)
    if (problems.length > 0) {
      await saveProblems(client, problems, ctx);  // ← Truyền PoolClient
    }
    
    // 4. Resolve problems không còn tồn tại
    await client.query(/* resolve query */);
    
    await client.query("COMMIT");  // Commit tất cả
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

**Lợi ích:**
- ✅ Tất cả operations trong 1 transaction → Atomic
- ✅ Nếu có lỗi ở bất kỳ bước nào, tất cả đều rollback
- ✅ Hiệu quả hơn: Không cần nhiều transactions riêng lẻ

---

## 🔍 Queries Kiểm Tra

### 1. Tổng Quan Problems

```sql
SELECT 
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE status = 'open') as open_problems,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_problems,
  COUNT(DISTINCT problem_id) as unique_problem_types,
  COUNT(DISTINCT database_name) as affected_databases
FROM monitoring.problems;
```

### 2. Xem Tất Cả Problems Đang Mở

```sql
SELECT 
  id,
  problem_id,
  priority,
  category,
  title,
  instance_label,
  database_name,
  detected_at,
  first_seen_at
FROM monitoring.problems
WHERE status = 'open'
ORDER BY 
  CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
  detected_at DESC;
```

### 3. Resolve Một Problem

```sql
UPDATE monitoring.problems
SET status = 'resolved'
WHERE id = 1;
-- Trigger tự động set resolved_at = now()
```

---

## 🎯 Tóm Tắt

### Cơ Chế Lưu Problems

1. **UPSERT**: INSERT nếu chưa có, UPDATE nếu đã có (cùng problem_id + database + instance + status='open')
2. **Partial Unique Index**: Đảm bảo chỉ có 1 bản ghi "open" cho mỗi problem_id + database + instance
3. **Trigger**: Tự động cập nhật `updated_at` và `resolved_at`
4. **Transaction**: Lưu nhiều problems trong 1 transaction để đảm bảo atomic

### Lợi Ích

- ✅ **Tránh duplicate**: Không có 2 bản ghi "open" trùng lặp
- ✅ **Lịch sử đầy đủ**: Giữ lại tất cả bản ghi "resolved" để phân tích
- ✅ **Tự động cập nhật**: Trigger tự động quản lý timestamps
- ✅ **Hiệu quả**: UPSERT nhanh hơn kiểm tra rồi INSERT/UPDATE riêng

---

## 📚 Tài Liệu Tham Khảo

- **[MONITORING_SETUP_AND_QUERIES.sql](./MONITORING_SETUP_AND_QUERIES.sql)** - SQL schema và queries đầy đủ
- **[PROBLEM_ANALYZER_GUIDE.md](./PROBLEM_ANALYZER_GUIDE.md)** - Chi tiết về 24 rules, điều kiện trigger, và hành động khuyến nghị

---

**Tạo ngày:** 2024  
**Dự án:** PostgreSQL Dashboard - Problem Storage System
