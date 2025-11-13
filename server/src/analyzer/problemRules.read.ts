// server/src/problemRules.read.ts
// Read-Path Rules - Phân tích vấn đề liên quan đến đọc (Read operations)
// Rules: 3, 4, 10, 11, 11b, 13, 18

import type { Problem, ProblemAnalyzerInput } from "./problemAnalyzer";

/**
 * Read-Path Analyzer
 * Phân tích các vấn đề liên quan đến Read Path (cache, index, I/O read, temp files...)
 */
export class ReadPathAnalyzer {
  private problems: Problem[] = [];
  private input: ProblemAnalyzerInput;

  constructor(input: ProblemAnalyzerInput) {
    this.input = input;
  }

  /**
   * Phân tích tất cả Read-Path rules
   */
  analyze(): Problem[] {
    this.problems = [];
    
    this.analyzeCacheIssues();      // Rules 3, 4
    this.analyzePerformanceIssues(); // Rules 10, 11, 11b
    this.analyzeIOReadIssues();      // Rules 13, 18
    
    return this.problems;
  }

  /**
   * Phân tích vấn đề về Cache (Read-Path)
   */
  private analyzeCacheIssues(): void {
    const { overview, perDbCacheHit } = this.input;

    // Rule 3: Overall Cache Hit < 95%
    if (overview?.cacheHitPercent !== undefined && overview.cacheHitPercent < 95) {
      this.problems.push({
        id: "cache-hit-low-overall",
        priority: overview.cacheHitPercent < 90 ? "High" : "Medium",
        category: "Cache",
        path: "read",
        title: "Cache Hit Percentage Thấp",
        message: `Cache hit tổng thể: ${overview.cacheHitPercent.toFixed(2)}%`,
        action: overview.cacheHitPercent < 90
          ? "Cần tăng shared_buffers ngay lập tức. Kiểm tra workload và xem xét tăng RAM"
          : "Xem xét tăng shared_buffers hoặc tối ưu queries để tăng cache hit",
        currentValue: overview.cacheHitPercent,
        threshold: 95,
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 4: Per-DB Cache Hit < 95%
    const lowCacheHitDBs = perDbCacheHit.filter(
      (r) => r.cache_hit_pct !== null && r.cache_hit_pct !== undefined && r.cache_hit_pct < 95
    );
    if (lowCacheHitDBs.length > 0) {
      const dbNames = lowCacheHitDBs.slice(0, 3).map((r) => r.database).join(", ");
      const moreText = lowCacheHitDBs.length > 3 ? ` và ${lowCacheHitDBs.length - 3} database khác` : "";
      
      this.problems.push({
        id: "cache-hit-low-per-db",
        priority: lowCacheHitDBs.some((r) => (r.cache_hit_pct ?? 0) < 90) ? "High" : "Medium",
        category: "Cache",
        path: "read",
        title: "Cache Hit Thấp Theo Database",
        message: `${lowCacheHitDBs.length} database có cache hit < 95% (${dbNames}${moreText})`,
        action: "Kiểm tra workload của các database này và xem xét tăng shared_buffers",
        currentValue: lowCacheHitDBs.length,
        threshold: 0,
        metadata: {
          databases: lowCacheHitDBs.map((r) => ({
            database: r.database,
            cacheHitPct: r.cache_hit_pct,
            blksHit: r.blks_hit,
            blksRead: r.blks_read,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Phân tích vấn đề về Performance (Read-Path)
   */
  private analyzePerformanceIssues(): void {
    const { indexUsage, seqVsIdxScans, tableSizes } = this.input;

    // Rule 10: Index Usage < 50%
    const lowIndexUsage = indexUsage.filter(
      (r) => r.idx_usage !== null && r.idx_usage !== undefined && Number(r.idx_usage) < 50
    );
    if (lowIndexUsage.length > 0) {
      const tableNames = lowIndexUsage.slice(0, 3).map((r) => r.relname).join(", ");
      const moreText = lowIndexUsage.length > 3 ? ` và ${lowIndexUsage.length - 3} bảng khác` : "";
      
      this.problems.push({
        id: "index-usage-low",
        priority: "Medium",
        category: "Performance",
        path: "read",
        title: "Index Usage Thấp",
        message: `${lowIndexUsage.length} bảng có index usage < 50% (${tableNames}${moreText})`,
        action: "Xem xét tạo index cho các bảng có seq_scan cao. Phân tích queries để xác định index phù hợp",
        currentValue: lowIndexUsage.length,
        threshold: 0,
        metadata: {
          tables: lowIndexUsage.map((r) => ({
            table: r.relname,
            idxUsage: r.idx_usage,
            idxScan: r.idx_scan,
            seqScan: r.seq_scan,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 11: Sequential vs Index Scans - Low index usage
    const lowSeqVsIdx = seqVsIdxScans.filter(
      (r) =>
        r.idx_usage_percent !== null &&
        r.idx_usage_percent !== undefined &&
        Number(r.idx_usage_percent) < 50
    );
    if (lowSeqVsIdx.length > 0 && lowIndexUsage.length === 0) {
      const tableNames = lowSeqVsIdx.slice(0, 3).map((r) => `${r.schemaname}.${r.relname}`).join(", ");
      const moreText = lowSeqVsIdx.length > 3 ? ` và ${lowSeqVsIdx.length - 3} bảng khác` : "";
      
      this.problems.push({
        id: "seq-vs-index-scans-low",
        priority: "Medium",
        category: "Performance",
        path: "read",
        title: "Sequential Scan Quá Nhiều",
        message: `${lowSeqVsIdx.length} bảng có index usage < 50% (${tableNames}${moreText})`,
        action: "Phân tích queries và tạo index phù hợp để giảm sequential scan",
        currentValue: lowSeqVsIdx.length,
        threshold: 0,
        metadata: {
          tables: lowSeqVsIdx.map((r) => ({
            schema: r.schemaname,
            table: r.relname,
            idxUsagePercent: r.idx_usage_percent,
            seqScan: r.seq_scan,
            idxScan: r.idx_scan,
            liveTuples: r.n_live_tup,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // Rule 11b: Largest Table/Index Sizes - Bảng quá lớn
    if (tableSizes.length > 0) {
      const parseSize = (sizeStr: string | undefined): number => {
        if (!sizeStr) return 0;
        const units: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024, TB: 1024 * 1024 * 1024 * 1024 };
        const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
        if (!match || !match[1] || !match[2]) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        return value * (units[unit] || 0);
      };

      const largeTables = tableSizes.filter((r) => {
        const totalSizeBytes = parseSize(r.total_size);
        return totalSizeBytes > 10 * 1024 * 1024 * 1024; // > 10 GB
      });

      if (largeTables.length > 0) {
        const tableNames = largeTables.slice(0, 3).map((r) => `${r.schemaname}.${r.relname}`).join(", ");
        const moreText = largeTables.length > 3 ? ` và ${largeTables.length - 3} bảng khác` : "";
        
        this.problems.push({
          id: "table-sizes-large",
          priority: "Low",
          category: "Performance",
          path: "read",
          title: "Bảng/Index Quá Lớn",
          message: `${largeTables.length} bảng có kích thước > 10 GB (${tableNames}${moreText})`,
          action: "Xem xét phân vùng (partitioning) cho các bảng lớn. Kiểm tra bloat và chạy VACUUM FULL nếu cần",
          currentValue: largeTables.length,
          threshold: 0,
          metadata: {
            tables: largeTables.map((r) => ({
              schema: r.schemaname,
              table: r.relname,
              totalSize: r.total_size,
              tableSize: r.table_size,
              indexSize: r.index_size,
            })),
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Phân tích vấn đề về I/O Read (Read-Path)
   */
  private analyzeIOReadIssues(): void {
    const { waitEvents, tempFiles } = this.input;

    // Rule 13: Wait Events I/O
    if (waitEvents.length > 0) {
      const ioWaitEvents = waitEvents.filter((r) => r.wait_event_type === "IO");
      if (ioWaitEvents.length > 0) {
        this.problems.push({
          id: "wait-events-io",
          priority: "Medium",
          category: "I/O",
          path: "read",
          title: "Có Sessions Đang Chờ I/O",
          message: `Có ${ioWaitEvents.length} session(s) đang chờ I/O (tổng ${waitEvents.length} wait events)`,
          action: "Kiểm tra disk I/O performance. Xem xét tăng shared_buffers hoặc tối ưu queries để giảm disk reads",
          currentValue: ioWaitEvents.length,
          threshold: 0,
          metadata: {
            totalWaitEvents: waitEvents.length,
            ioWaitEvents: ioWaitEvents.length,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Rule 18: Temp Files > 0
    const hasTempFiles = tempFiles.filter((r) => (r.temp_files ?? 0) > 0);
    if (hasTempFiles.length > 0) {
      const totalTempFiles = hasTempFiles.reduce((sum, r) => sum + (r.temp_files ?? 0), 0);
      const totalTempBytes = hasTempFiles.reduce((sum, r) => sum + (Number(r.temp_bytes) || 0), 0);
      
      this.problems.push({
        id: "temp-files-detected",
        priority: totalTempBytes > 1000000000 ? "High" : "Medium", // > 1GB
        category: "I/O",
        path: "read",
        title: "Phát Hiện Temp Files",
        message: `${hasTempFiles.length} database có temp files (tổng ${totalTempFiles} files, ${this.formatBytes(totalTempBytes)})`,
        action: "Xem xét tăng work_mem để giảm temp file spills. Temp files xảy ra khi sort/hash không đủ memory",
        currentValue: totalTempFiles,
        threshold: 0,
        metadata: {
          databases: hasTempFiles.map((r) => ({
            database: r.datname,
            tempFiles: r.temp_files,
            tempBytes: r.temp_bytes,
          })),
        },
        detectedAt: new Date().toISOString(),
      });
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

