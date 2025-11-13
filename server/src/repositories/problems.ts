// server/src/repositories/problems.ts
// Repository để lưu trữ problems vào database
import { Pool, PoolClient } from "pg";
import { Problem } from "../analyzer/problemAnalyzer";

// Kiểu dữ liệu đến từ Analyzer (/api/problems)
// Tương thích với Problem interface từ problemAnalyzer
export type DetectedProblem = {
  id: string;                      // problem_id
  priority: "High" | "Medium" | "Low";
  category: "Connection" | "Performance" | "Locking" | "Cache" | "Maintenance" | "I/O" | "Transaction" | "Query";
  path: "read" | "write" | "neutral";
  title: string;
  message: string;
  action: string;
  currentValue?: any;
  threshold?: any;
  detectedAt: string;              // ISO timestamp
  metadata?: Record<string, any>;  // Optional metadata (không dùng khi lưu, luôn lưu {})
};

export type ProblemContext = {
  instanceLabel?: string;          // "Production DB"
  connectionHost?: string;         // "localhost:5432"
  databaseName?: string;           // "mydb"
};

/**
 * Upsert một problem vào database
 * Nếu đã có bản ghi "open" cùng (problem_id, database_name, instance_label) → UPDATE
 * Nếu chưa có → INSERT bản ghi mới với status='open'
 */
export async function upsertProblem(client: PoolClient, p: DetectedProblem, ctx: ProblemContext) {
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

  // Convert currentValue và threshold sang JSONB
  // pg library sẽ tự động serialize JavaScript values sang JSONB
  // Nếu không có giá trị, dùng {} như trong code mẫu
  const currentValueJson = p.currentValue ?? {};
  const thresholdJson = p.threshold ?? {};

  const values = [
    p.id, p.priority, p.category, p.path,
    p.title, p.message, p.action,
    currentValueJson, thresholdJson, {},   // pg sẽ tự serialize sang JSONB
    ctx.instanceLabel ?? null,
    ctx.connectionHost ?? null,
    ctx.databaseName ?? null,
    p.detectedAt,
  ];

  try {
    const result = await client.query(sql, values);
    const returnedId = result.rows[0]?.id;
    console.log(`[upsertProblem] Successfully upserted problem ${p.id}, returned id: ${returnedId}`);
    return returnedId;
  } catch (error: any) {
    console.error(`[upsertProblem] Error upserting problem ${p.id}:`, error.message);
    console.error(`[upsertProblem] Error code:`, error.code);
    console.error(`[upsertProblem] Error detail:`, error.detail);
    console.error(`[upsertProblem] SQL:`, sql);
    console.error(`[upsertProblem] Values:`, JSON.stringify(values, null, 2));
    throw error;
  }
}

/**
 * Lưu nhiều problems vào database trong một transaction
 * Chấp nhận Problem[] từ analyzer hoặc DetectedProblem[]
 * @param poolOrClient - Pool hoặc PoolClient. Nếu là PoolClient, sẽ dùng client đó (không tạo transaction riêng)
 * @param problems - Danh sách problems cần lưu
 * @param ctx - Context (instance_label, connection_host, database_name)
 */
export async function saveProblems(
  poolOrClient: Pool | PoolClient, 
  problems: (DetectedProblem | Problem)[], 
  ctx: ProblemContext
) {
  console.log("[saveProblems] ========================================");
  console.log(`[saveProblems] Function called with ${problems?.length || 0} problems`);
  
  if (!problems?.length) {
    console.log("[saveProblems] ⚠️  No problems to save, returning early");
    return;
  }

  console.log(`[saveProblems] ✅ Starting to save ${problems.length} problems`);
  console.log(`[saveProblems] Context:`, JSON.stringify(ctx, null, 2));
  
  // Nếu đã có client (từ scheduler), dùng client đó. Nếu không, tạo mới từ pool
  // PoolClient có method release(), Pool có method connect()
  const isExternalClient = typeof (poolOrClient as any).release === 'function';
  const client = isExternalClient ? poolOrClient as PoolClient : await (poolOrClient as Pool).connect();
  const shouldManageTransaction = !isExternalClient;
  const shouldReleaseClient = !isExternalClient;
  
  try {
    if (shouldManageTransaction) {
      console.log("[saveProblems] Beginning transaction...");
      await client.query("BEGIN");
    }
    
    console.log("[saveProblems] Upserting problems...");
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p) continue; // Skip nếu undefined (không nên xảy ra)
      console.log(`[saveProblems] Upserting problem ${i + 1}/${problems.length}: ${p.id}`);
      try {
        const id = await upsertProblem(client, p, ctx);
        console.log(`[saveProblems] Successfully upserted problem ${p.id}, returned id: ${id}`);
      } catch (upsertError: any) {
        console.error(`[saveProblems] Error upserting problem ${p.id}:`, upsertError.message);
        console.error(`[saveProblems] Error code:`, upsertError.code);
        console.error(`[saveProblems] Error detail:`, upsertError.detail);
        throw upsertError; // Re-throw để rollback
      }
    }
    
    if (shouldManageTransaction) {
      console.log("[saveProblems] Committing transaction...");
      await client.query("COMMIT");
    }
    console.log(`[saveProblems] ✅✅✅ Successfully saved ${problems.length} problems ✅✅✅`);
    console.log("[saveProblems] ========================================");
  } catch (e: any) {
    console.error("[saveProblems] Error in transaction:", e.message);
    console.error("[saveProblems] Error code:", e.code);
    console.error("[saveProblems] Error detail:", e.detail);
    console.error("[saveProblems] Error stack:", e.stack);
    
    if (shouldManageTransaction) {
      try {
        console.log("[saveProblems] Rolling back transaction...");
        await client.query("ROLLBACK");
        console.log("[saveProblems] Transaction rolled back");
      } catch (rollbackError: any) {
        console.error("[saveProblems] Error during rollback:", rollbackError.message);
      }
    }
    throw e;
  } finally {
    if (shouldReleaseClient) {
      client.release();
      console.log("[saveProblems] Client released");
    }
    console.log("[saveProblems] ========================================");
  }
}

