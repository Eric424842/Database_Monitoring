-- ============================================
-- PostgreSQL Problem Monitoring - Setup & Essential Queries
-- ============================================
-- File tổng hợp: Schema setup + Queries cần thiết
-- ============================================

-- ============================================
-- PHẦN 1: SCHEMA SETUP
-- ============================================

-- 1. Schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- 2. ENUMs
DO $$
BEGIN
  -- Priority: High, Medium, Low
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_priority') THEN
    CREATE TYPE monitoring.problem_priority AS ENUM ('High','Medium','Low');
  END IF;

  -- Status: open, resolved, suppressed
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_status') THEN
    CREATE TYPE monitoring.problem_status AS ENUM ('open','resolved','suppressed');
  END IF;

  -- Path: read, write, neutral
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_path') THEN
    CREATE TYPE monitoring.problem_path AS ENUM ('read','write','neutral');
  END IF;

  -- Category: 8 categories
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_category') THEN
    CREATE TYPE monitoring.problem_category AS ENUM (
      'Connection',
      'Performance',
      'Locking',
      'Cache',
      'Maintenance',
      'I/O',
      'Transaction',
      'Query'
    );
  END IF;
END $$;

-- 3. Table
CREATE TABLE IF NOT EXISTS monitoring.problems (
  -- Primary key
  id               BIGSERIAL PRIMARY KEY,
  
  -- Problem identification
  problem_id       VARCHAR(255) NOT NULL,
  
  -- Problem attributes
  priority         monitoring.problem_priority NOT NULL,
  category         monitoring.problem_category NOT NULL,
  path             monitoring.problem_path NOT NULL,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  action           TEXT NOT NULL,
  
  -- Flexible data
  current_value    JSONB NOT NULL DEFAULT '{}'::jsonb,
  threshold        JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Database instance tracking
  instance_label   VARCHAR(255),
  connection_host  VARCHAR(255),
  database_name    VARCHAR(255),
  
  -- Status & lifecycle
  status           monitoring.problem_status NOT NULL DEFAULT 'open',
  first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,
  
  -- Audit trail
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_problems_detected_at  
  ON monitoring.problems(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_problems_priority     
  ON monitoring.problems(priority);

CREATE INDEX IF NOT EXISTS idx_problems_category     
  ON monitoring.problems(category);

CREATE INDEX IF NOT EXISTS idx_problems_path         
  ON monitoring.problems(path);

CREATE INDEX IF NOT EXISTS idx_problems_database    
  ON monitoring.problems(database_name);

CREATE INDEX IF NOT EXISTS idx_problems_instance     
  ON monitoring.problems(instance_label);

CREATE INDEX IF NOT EXISTS idx_problems_status       
  ON monitoring.problems(status);

-- Composite indexes cho query thường dùng
CREATE INDEX IF NOT EXISTS idx_problems_priority_status 
  ON monitoring.problems(priority, status) 
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_problems_category_status 
  ON monitoring.problems(category, status) 
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_problems_path_status 
  ON monitoring.problems(path, status) 
  WHERE status = 'open';

-- Partial unique index: mỗi problem_id + database + instance chỉ 1 bản ghi 'open'
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_problem_per_db
  ON monitoring.problems(problem_id, database_name, instance_label)
  WHERE status = 'open';

-- Index hỗ trợ tra cứu/resolve 1 problem nhanh
CREATE INDEX IF NOT EXISTS idx_problems_problem_id_status
  ON monitoring.problems(problem_id, status)
  WHERE status = 'open';

-- Index hỗ trợ lọc theo database (nếu UI lọc theo DB nhiều)
CREATE INDEX IF NOT EXISTS idx_problems_database_status
  ON monitoring.problems(database_name, status)
  WHERE status = 'open';

-- 5. Trigger cập nhật updated_at & resolved_at tự động
CREATE OR REPLACE FUNCTION monitoring.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  
  IF NEW.status = 'resolved'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at := now();
  END IF;
  
  IF OLD.first_seen_at IS NOT NULL THEN
    NEW.first_seen_at := OLD.first_seen_at;
  END IF;
  
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_problems_touch ON monitoring.problems;
CREATE TRIGGER trg_problems_touch
BEFORE UPDATE ON monitoring.problems
FOR EACH ROW EXECUTE FUNCTION monitoring.touch_updated_at();

-- 6. Comments
COMMENT ON TABLE monitoring.problems IS 
  'Lưu trữ vấn đề được phát hiện bởi Problem Analyzer. Mỗi problem_id + database + instance chỉ có 1 bản ghi status=''open''.';

COMMENT ON COLUMN monitoring.problems.problem_id IS 
  'ID của vấn đề từ Problem Analyzer (ví dụ: "connection-usage-high", "deadlocks-detected")';

COMMENT ON COLUMN monitoring.problems.instance_label IS 
  'Tên hiển thị của database instance (ví dụ: "Production DB", "Staging")';

COMMENT ON COLUMN monitoring.problems.connection_host IS 
  'Hostname/IP và port của connection (ví dụ: "localhost:5432", "192.168.1.100:5432")';

COMMENT ON COLUMN monitoring.problems.first_seen_at IS 
  'Thời điểm lần đầu phát hiện vấn đề này (không thay đổi khi update)';

COMMENT ON COLUMN monitoring.problems.detected_at IS 
  'Thời điểm lần cuối phát hiện vấn đề (có thể update khi problem tái xuất hiện)';

-- 7. Cấp quyền tối thiểu cho user app
-- Thay 'your_app_user' bằng tên user thực tế của app (ví dụ: user từ PGUSER trong .env)
-- Ví dụ: nếu PGUSER=monitor thì thay 'your_app_user' = 'monitor'

GRANT USAGE ON SCHEMA monitoring TO your_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE monitoring.problems TO your_app_user;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE monitoring.problems_id_seq TO your_app_user;
GRANT USAGE ON TYPE monitoring.problem_priority TO your_app_user;
GRANT USAGE ON TYPE monitoring.problem_status TO your_app_user;
GRANT USAGE ON TYPE monitoring.problem_path TO your_app_user;
GRANT USAGE ON TYPE monitoring.problem_category TO your_app_user;

-- Tham khảo: Nếu muốn dùng CURRENT_USER (user hiện tại đang chạy script)
-- GRANT USAGE ON SCHEMA monitoring TO CURRENT_USER;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE monitoring.problems TO CURRENT_USER;
-- GRANT USAGE, SELECT, UPDATE ON SEQUENCE monitoring.problems_id_seq TO CURRENT_USER;
-- GRANT USAGE ON TYPE monitoring.problem_priority TO CURRENT_USER;
-- GRANT USAGE ON TYPE monitoring.problem_status TO CURRENT_USER;
-- GRANT USAGE ON TYPE monitoring.problem_path TO CURRENT_USER;
-- GRANT USAGE ON TYPE monitoring.problem_category TO CURRENT_USER;

-- Kiểm tra quyền đã được cấp
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'monitoring' 
  AND table_name = 'problems';

-- ============================================
-- PHẦN 2: UPSERT STATEMENT (Đã cập nhật)
-- ============================================

-- Câu lệnh UPSERT chuẩn (dùng partial unique index)
-- Lưu 1 problem "open"/rule/DB/instance; nếu trùng thì update
-- Sử dụng với parameterized query ($1, $2, ...)
-- 
-- LƯU Ý: Cú pháp ON CONFLICT (columns) WHERE condition là cách đúng
-- để làm việc với partial unique index trong PostgreSQL
--
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

-- ============================================
-- PHẦN 3: ESSENTIAL QUERIES
-- ============================================

-- 1. Kiểm tra tổng quan (có problems nào được lưu không?)
SELECT 
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE status = 'open') as open_problems,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_problems,
  COUNT(DISTINCT problem_id) as unique_problem_types,
  COUNT(DISTINCT database_name) as affected_databases
FROM monitoring.problems;

-- 2. Xem tất cả problems đang mở (quan trọng nhất)
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

-- 3. Xem chi tiết một problem cụ thể
-- Cách 1: Tra theo khóa chính (id là BIGSERIAL)
SELECT 
  id,
  problem_id,
  priority,
  category,
  path,
  title,
  message,
  action,
  current_value,
  threshold,
  instance_label,
  connection_host,
  database_name,
  first_seen_at,
  detected_at,
  resolved_at
FROM monitoring.problems
WHERE id = $1;  -- $1 là id (bigint)

-- Cách 2: Tra theo mã rule đang mở (problem_id là VARCHAR)
SELECT 
  id,
  problem_id,
  priority,
  category,
  path,
  title,
  message,
  action,
  current_value,
  threshold,
  instance_label,
  connection_host,
  database_name,
  first_seen_at,
  detected_at,
  resolved_at
FROM monitoring.problems
WHERE problem_id = $1 
  AND status = 'open'
ORDER BY detected_at DESC
LIMIT 1;  -- $1 là problem_id (ví dụ: 'waiting-sessions')

-- 4. Resolve một problem (đã xử lý xong)
UPDATE monitoring.problems
SET status = 'resolved'
WHERE id = $1;  -- $1 là id (bigint)
-- Trigger sẽ tự động set resolved_at = now()

-- 5. Suppress một problem (tạm thời bỏ qua)
UPDATE monitoring.problems
SET status = 'suppressed'
WHERE id = $1;  -- $1 là id (bigint)

-- ============================================
-- PHẦN 4: TIỆN ÍCH (Tùy chọn)
-- ============================================

-- VIEW: Xem nhanh các problems đang mở
CREATE OR REPLACE VIEW monitoring.open_problems AS
SELECT 
  id,
  problem_id,
  priority,
  category,
  path,
  title,
  message,
  action,
  current_value,
  threshold,
  instance_label,
  connection_host,
  database_name,
  first_seen_at,
  detected_at
FROM monitoring.problems
WHERE status = 'open';

COMMENT ON VIEW monitoring.open_problems IS 
  'View để xem nhanh tất cả problems đang mở, giúp code app/BI gọn hơn';

-- FUNCTION: Upsert problem (tiện ích, không bắt buộc)
-- App có thể gọi function này thay vì viết INSERT ... ON CONFLICT
CREATE OR REPLACE FUNCTION monitoring.upsert_problem(
  p_problem_id VARCHAR(255),
  p_priority monitoring.problem_priority,
  p_category monitoring.problem_category,
  p_path monitoring.problem_path,
  p_title TEXT,
  p_message TEXT,
  p_action TEXT,
  p_current_value JSONB DEFAULT '{}'::jsonb,
  p_threshold JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_instance_label VARCHAR(255) DEFAULT NULL,
  p_connection_host VARCHAR(255) DEFAULT NULL,
  p_database_name VARCHAR(255) DEFAULT NULL,
  p_detected_at TIMESTAMPTZ DEFAULT now()
)
RETURNS BIGINT AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO monitoring.problems
  (problem_id, priority, category, path, title, message, action,
   current_value, threshold, metadata,
   instance_label, connection_host, database_name,
   status, detected_at)
  VALUES
  (p_problem_id, p_priority, p_category, p_path,
   p_title, p_message, p_action,
   p_current_value, p_threshold, p_metadata,
   p_instance_label, p_connection_host, p_database_name,
   'open', p_detected_at)
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
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION monitoring.upsert_problem IS 
  'Function tiện ích để upsert problem, giúp code app gọn hơn. Trả về id của problem.';

-- Grant quyền sử dụng function và view
GRANT SELECT ON monitoring.open_problems TO your_app_user;
GRANT EXECUTE ON FUNCTION monitoring.upsert_problem TO your_app_user;

-- ============================================
-- PHẦN 5: AUTO-RESOLVE PROBLEMS (Tự động resolve sau 30 phút không detect)
-- ============================================

-- FUNCTION: Tự động resolve các problems đã không được detect trong 30 phút
-- Logic: Nếu problem đang "open" nhưng detected_at > 30 phút trước → auto-resolve
CREATE OR REPLACE FUNCTION monitoring.auto_resolve_stale_problems(
  p_stale_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  resolved_count INTEGER,
  resolved_ids BIGINT[]
) AS $$
DECLARE
  v_resolved_ids BIGINT[];
  v_count INTEGER;
BEGIN
  -- Resolve các problems đã không được detect trong p_stale_minutes phút
  WITH resolved AS (
    UPDATE monitoring.problems
    SET status = 'resolved'
    WHERE status = 'open'
      AND detected_at < now() - (p_stale_minutes || ' minutes')::INTERVAL
    RETURNING id
  )
  SELECT 
    COUNT(*),
    ARRAY_AGG(id)
  INTO v_count, v_resolved_ids
  FROM resolved;
  
  RETURN QUERY SELECT v_count, v_resolved_ids;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION monitoring.auto_resolve_stale_problems IS 
  'Tự động resolve các problems đã không được detect trong N phút (mặc định 30 phút). 
   Trả về số lượng và danh sách ID đã được resolve.';

-- Grant quyền
GRANT EXECUTE ON FUNCTION monitoring.auto_resolve_stale_problems TO your_app_user;

-- ============================================
-- PHẦN 6: SCHEDULED JOB (pg_cron - Tùy chọn)
-- ============================================

-- Nếu đã cài đặt extension pg_cron, có thể schedule job tự động
-- Chạy mỗi 30 phút để auto-resolve stale problems

-- Bước 1: Enable extension (chạy với quyền superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Bước 2: Schedule job chạy mỗi 30 phút
-- SELECT cron.schedule(
--   'auto-resolve-stale-problems',  -- job name
--   '*/30 * * * *',                 -- cron: mỗi 30 phút
--   $$SELECT monitoring.auto_resolve_stale_problems(30)$$
-- );

-- Bước 3: Xem danh sách scheduled jobs
-- SELECT * FROM cron.job;

-- Bước 4: Xóa job nếu cần
-- SELECT cron.unschedule('auto-resolve-stale-problems');

-- ============================================
-- PHẦN 7: MANUAL CHECK & RESOLVE
-- ============================================

-- Chạy thủ công để resolve stale problems (30 phút)
SELECT * FROM monitoring.auto_resolve_stale_problems(30);

-- Xem các problems sắp bị auto-resolve (đã > 25 phút không detect)
SELECT 
  id,
  problem_id,
  priority,
  category,
  title,
  instance_label,
  database_name,
  detected_at,
  EXTRACT(EPOCH FROM (now() - detected_at))/60 as minutes_since_detection
FROM monitoring.problems
WHERE status = 'open'
  AND detected_at < now() - INTERVAL '25 minutes'
ORDER BY detected_at ASC;

-- ============================================
-- END OF FILE
-- ============================================

