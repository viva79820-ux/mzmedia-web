import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const MIGRATION = path.join(process.cwd(), "prisma", "migrations", "20261103000000_ai_office", "migration.sql");

let ready: Promise<void> | null = null;

export function ensureOfficeSchema() {
  ready ??= applyOfficeSchema().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

async function applyOfficeSchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  try {
    const found = await pool.query(`SELECT to_regclass('public."OfficeJob"') AS name`);
    if (found.rows[0]?.name) return;

    const sql = readFileSync(MIGRATION, "utf8");
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((part) => part.trim())
      .filter((part) => part.replace(/--[^\n]*/g, "").trim().length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
  } finally {
    await pool.end();
  }
}
