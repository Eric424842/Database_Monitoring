// server/src/db.ts
import { Pool, QueryResultRow, PoolConfig } from "pg";

// Default pool từ .env
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Cache pools theo connection string để tái sử dụng
const poolCache = new Map<string, Pool>();

// Tạo pool từ connection config
export function getPoolFromConfig(config: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}): Pool {
  // Nếu không có config, dùng default pool
  if (!config.host && !config.user && !config.database) {
    return pool;
  }

  // Tạo connection string key để cache
  const key = `${config.host || process.env.PGHOST}:${config.port || process.env.PGPORT}:${config.user || process.env.PGUSER}:${config.database || process.env.PGDATABASE}`;

  // Nếu đã có pool trong cache, trả về
  if (poolCache.has(key)) {
    return poolCache.get(key)!;
  }

  // Tạo pool mới
  const newPool = new Pool({
    host: config.host || process.env.PGHOST,
    port: Number(config.port ?? process.env.PGPORT ?? 5432),
    user: config.user || process.env.PGUSER,
    password: config.password || process.env.PGPASSWORD,
    database: config.database || process.env.PGDATABASE,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Lưu vào cache
  poolCache.set(key, newPool);

  return newPool;
}

// Generic helper với ràng buộc đúng kiểu của pg:
export async function q<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
  poolToUse?: Pool
): Promise<T[]> {
  const poolInstance = poolToUse || pool;
  const res = await poolInstance.query<T>(text, params);
  return res.rows as T[];
}
