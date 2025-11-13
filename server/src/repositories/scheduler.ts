// server/src/repositories/scheduler.ts
// Problem Scheduler - Lightweight coordinator
// Chạy mỗi 30 phút để phát hiện và lưu problems vào database
// - Không chứa logic nặng (27 metrics, 20/24 rules) - đã nằm trong problemAnalyzer
// - Chỉ điều phối: cron → collect metrics → analyze → upsert → resolve

import { Pool } from "pg";
import cron from "node-cron";
import { analyzeProblems, type Problem } from "../analyzer/problemAnalyzer";
import { saveProblems, type ProblemContext } from "./problems";
import { getDefaultInstanceInfo } from "../utils/instanceInfo";
import { collectMetricsForAnalyzer } from "../utils/metricsCollector";

// Advisory lock key (cố định)
const LOCK_KEY = BigInt(42_001_001);

/**
 * Chạy một lần scan để phát hiện và lưu problems
 * Có thể được gọi từ cron job hoặc từ API endpoint test
 * @param pool - Database pool
 * @param skipLock - Nếu true, bỏ qua advisory lock (dùng cho test)
 * @returns Kết quả scan: { detected: number, resolved: number, problems: Problem[] }
 */
export async function runProblemScan(pool: Pool, skipLock: boolean = false) {
  const timestamp = new Date().toISOString();
  const isManual = skipLock;
  const prefix = isManual ? "[scheduler-test]" : "[scheduler]";
  
  console.log(`\n${prefix} ========================================`);
  console.log(`${prefix} ⏰ ${isManual ? 'MANUAL TRIGGER' : 'CRON TRIGGERED'} at ${timestamp}`);
  console.log(`${prefix} Starting problem scan...`);
  
  const client = await pool.connect();
  try {
    // 1) Tránh overlap: thử lấy advisory lock (trừ khi skipLock = true)
    if (!skipLock) {
      const { rows } = await client.query<{ got: boolean }>(
        "SELECT pg_try_advisory_lock($1) AS got",
        [LOCK_KEY]
      );
      if (!rows[0]?.got) {
        console.warn(`${prefix} ⚠️  Another scan is running, skipping this tick at ${timestamp}`);
        return { detected: 0, resolved: 0, problems: [], skipped: true };
      }
      console.log(`${prefix} ✅ Advisory lock acquired`);
    } else {
      console.log(`${prefix} ⚠️  Skipping advisory lock (manual test mode)`);
    }

    // 2) Lấy context instance
    const ctx = await getDefaultInstanceInfo(client);

    await client.query("BEGIN");

    // 3) Thu thập metrics và chạy analyzer
    console.log(`${prefix} Collecting metrics...`);
    const analyzerInput = await collectMetricsForAnalyzer(client, 60);
    console.log(`${prefix} Running problem analyzer...`);
    const problems = analyzeProblems(analyzerInput);
    console.log(`${prefix} Found ${problems.length} problems:`, problems.map(p => p.id).join(", "));

    // 4) Upsert problems hiện tại (dùng cùng client để giữ transaction)
    // saveProblems sẽ tự động phát hiện client và không tạo transaction mới
    if (problems.length > 0) {
      await saveProblems(client, problems, ctx);
    }

    // 5) Resolve những problem "open" nhưng không còn trong lần quét này
    const currentIds = problems.map(p => p.id);
    const resolveResult = await client.query(
      `
      UPDATE monitoring.problems p
      SET status = 'resolved'
      WHERE p.status = 'open'
        AND (p.database_name IS NOT DISTINCT FROM $1)
        AND (p.instance_label IS NOT DISTINCT FROM $2)
        AND (CASE WHEN $3::text[] IS NULL OR array_length($3::text[],1) IS NULL
                  THEN true
                  ELSE p.problem_id <> ALL($3::text[])
             END)
      `,
      [ctx.databaseName ?? null, ctx.instanceLabel ?? null, currentIds.length > 0 ? currentIds : null]
    );
    const resolvedCount = resolveResult.rowCount || 0;

    await client.query("COMMIT");
    const endTime = new Date().toISOString();
    console.log(`${prefix} ✅ Scan completed at ${endTime}`);
    console.log(`${prefix} 📊 Results: detected=${problems.length}, resolved=${resolvedCount}`);
    console.log(`${prefix} ========================================\n`);
    
    return { detected: problems.length, resolved: resolvedCount, problems };
  } catch (err: any) {
    await client.query("ROLLBACK");
    const errorTime = new Date().toISOString();
    console.error(`${prefix} ❌ Error at ${errorTime}:`, err);
    console.error(`${prefix} ========================================\n`);
    throw err;
  } finally {
    // Nhả lock (nếu đã giữ)
    if (!skipLock) {
      try { 
        await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]); 
      } catch {}
    }
    client.release();
  }
}

/**
 * Khởi động Problem Scheduler
 * Chạy mỗi 30 phút để phát hiện và lưu problems
 */
export function startProblemScheduler(pool: Pool) {
  // Chạy mỗi 30 phút
  cron.schedule("*/30 * * * *", async () => {
    await runProblemScan(pool, false);
  });

  const nextRun = new Date();
  nextRun.setMinutes(nextRun.getMinutes() + (30 - (nextRun.getMinutes() % 30)));
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);
  
  console.log("[scheduler] ✅ Problem Scheduler started successfully!");
  console.log(`[scheduler] ⏰ Schedule: Every 30 minutes (cron: */30 * * * *)`);
  console.log(`[scheduler] 📅 Next run: ${nextRun.toISOString()}`);
}
