// server/src/utils/instanceInfo.ts
// Utility để lấy thông tin instance mặc định từ environment variables
import { PoolClient } from "pg";
import { ProblemContext } from "../repositories/problems";

/**
 * Lấy thông tin instance mặc định từ environment variables
 * Tương tự như getProblemContextFromRequest nhưng không cần request
 */
export async function getDefaultInstanceInfo(client: PoolClient): Promise<ProblemContext> {
  // Lấy database name từ current_database()
  const dbResult = await client.query<{ current_database: string }>(
    "SELECT current_database() AS current_database"
  );
  const databaseName = dbResult.rows[0]?.current_database || process.env.PGDATABASE || undefined;

  // Tạo connection_host từ env
  let connectionHost: string | undefined;
  if (process.env.PGHOST) {
    const port = process.env.PGPORT || "5432";
    connectionHost = `${process.env.PGHOST}:${port}`;
  }

  // Tạo instance_label từ database và host
  const instanceLabel = connectionHost && databaseName
    ? `${databaseName} (${connectionHost})`
    : undefined;

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

