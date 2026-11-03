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
    if (!found.rows[0]?.name) {
      const sql = readFileSync(MIGRATION, "utf8");
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((part) => part.trim())
        .filter((part) => part.replace(/--[^\n]*/g, "").trim().length > 0);

      for (const statement of statements) {
        await pool.query(statement);
      }
    }

    await pool.query(`ALTER TABLE "OfficeJob" ADD COLUMN IF NOT EXISTS "inquiryId" TEXT`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "OfficeJob_inquiryId_key" ON "OfficeJob"("inquiryId")`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "OfficeAgent" (
      "id" TEXT NOT NULL,
      "agentKey" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "businessDomain" TEXT NOT NULL DEFAULT '',
      "systemInstructions" TEXT NOT NULL DEFAULT '',
      "allowedTools" TEXT NOT NULL DEFAULT '[]',
      "inputSchema" TEXT NOT NULL DEFAULT '{}',
      "outputSchema" TEXT NOT NULL DEFAULT '{}',
      "evaluationCriteria" TEXT NOT NULL DEFAULT '',
      "version" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "deferredNote" TEXT NOT NULL DEFAULT '',
      "testResult" TEXT NOT NULL DEFAULT '',
      "decisionLog" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "approvedAt" TIMESTAMP(3),
      "approvedBy" TEXT NOT NULL DEFAULT '',
      CONSTRAINT "OfficeAgent_pkey" PRIMARY KEY ("id")
    )`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "OfficeAgent_agentKey_version_key" ON "OfficeAgent"("agentKey", "version")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OfficeAgent_status_agentKey_idx" ON "OfficeAgent"("status", "agentKey")`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "OfficeDelegation" (
      "id" TEXT NOT NULL,
      "parentJobId" TEXT NOT NULL,
      "agentId" TEXT NOT NULL,
      "agentVersion" INTEGER NOT NULL,
      "assignedGoal" TEXT NOT NULL,
      "inputData" TEXT NOT NULL DEFAULT '{}',
      "status" TEXT NOT NULL,
      "outputData" TEXT NOT NULL DEFAULT '',
      "evaluationResult" TEXT NOT NULL DEFAULT '',
      "toolCalls" TEXT NOT NULL DEFAULT '[]',
      "startedAt" TIMESTAMP(3),
      "completedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OfficeDelegation_pkey" PRIMARY KEY ("id")
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OfficeDelegation_parentJobId_idx" ON "OfficeDelegation"("parentJobId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OfficeDelegation_agentId_idx" ON "OfficeDelegation"("agentId")`);
    await pool.query(`INSERT INTO "OfficeAgent" ("id", "agentKey", "name", "description", "businessDomain", "systemInstructions", "allowedTools", "evaluationCriteria", "version", "status", "approvedAt", "approvedBy", "updatedAt")
      SELECT 'seed-agent-pm', 'pm', '기존 PM', '지금 오피스의 계획과 초안 기능', '공통', '기존 7개 도구로 내부 초안만 만든다. 발송, 결제, 계약, 배포는 하지 않는다.', '["query_runs","save_plan","draft_document","search_memory","evaluate_result","propose_improvement","request_approval"]', '막힌 업무는 운영 DB를 읽고, 없는 값은 확인 필요로 남긴다.', 1, 'ACTIVE', CURRENT_TIMESTAMP, '기존 오피스', CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM "OfficeAgent" WHERE "agentKey" = 'pm')`);
  } finally {
    await pool.end();
  }
}
