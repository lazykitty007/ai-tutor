import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();

function getConfig() {
  if (process.env.DATABASE_URL) {
    return { uri: process.env.DATABASE_URL };
  }

  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || "ai_tutor_nextjs",
    user: process.env.MYSQL_USER || "ai_tutor",
    password: process.env.MYSQL_PASSWORD || "ai_tutor_pass",
  };
}

async function connect() {
  const config = getConfig();
  return mysql.createConnection({
    ...(config.uri ? { uri: config.uri } : config),
    multipleStatements: true,
    timezone: "Z",
  });
}

async function runFile(file) {
  const sql = await readFile(path.join(root, file), "utf8");
  const connection = await connect();

  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }
}

async function main() {
  const command = process.argv[2];

  if (command === "migrate") {
    await runFile("db/schema.sql");
    console.log("Database schema created.");
    return;
  }

  if (command === "seed") {
    await runFile("db/seed.sql");
    console.log("Database seed data inserted.");
    return;
  }

  if (command === "reset") {
    await runFile("db/reset.sql");
    await runFile("db/schema.sql");
    await runFile("db/seed.sql");
    console.log("Database reset complete.");
    return;
  }

  console.error("Usage: node scripts/db.mjs <migrate|seed|reset>");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
