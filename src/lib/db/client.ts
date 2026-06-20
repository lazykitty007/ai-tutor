import mysql, { type Pool, type PoolConnection, type PoolOptions } from "mysql2/promise";

let pool: Pool | undefined;

function getPoolConfig(): PoolOptions {
  const uri = process.env.DATABASE_URL;

  if (uri) {
    return {
      uri,
      connectionLimit: 10,
      timezone: "Z",
    };
  }

  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || "ai_tutor_nextjs",
    user: process.env.MYSQL_USER || "ai_tutor",
    password: process.env.MYSQL_PASSWORD || "ai_tutor_pass",
    connectionLimit: 10,
    timezone: "Z",
  };
}

export function getDbPool(): Pool {
  pool ??= mysql.createPool(getPoolConfig());
  return pool;
}

export async function withConnection<T>(fn: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getDbPool().getConnection();

  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}
