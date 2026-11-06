import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { cardsMatch, chooseStandards, classifyQuestion, learnableAnswer, nearbyCard, publicWords, type HomeReply } from "@/lib/home/answer";

export type HomeAsk = {
  id: string;
  question: string;
  answer: string;
  needsInquiry: boolean;
  approved: string;
  service: string;
  industry: string;
  learnable: boolean;
  standard: boolean;
  locked: boolean;
  createdAt: string;
  approvedAt: string;
};

const filePath = path.join(process.cwd(), "data", "home-asks.json");

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

function useDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  pool ??= new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15_000 });
  return pool;
}

function ensureTable() {
  const db = getPool();
  if (!db) return Promise.resolve();
  ready ??= db
    .query(`CREATE TABLE IF NOT EXISTS "HomeAsk" (
      "id" TEXT PRIMARY KEY,
      "question" TEXT NOT NULL DEFAULT '',
      "answer" TEXT NOT NULL DEFAULT '',
      "needsInquiry" BOOLEAN NOT NULL DEFAULT FALSE,
      "approved" TEXT NOT NULL DEFAULT '',
      "service" TEXT NOT NULL DEFAULT '',
      "industry" TEXT NOT NULL DEFAULT '',
      "learnable" BOOLEAN NOT NULL DEFAULT FALSE,
      "standard" BOOLEAN NOT NULL DEFAULT FALSE,
      "locked" BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "approvedAt" TIMESTAMPTZ
    )`)
    .then(() => db.query(`ALTER TABLE "HomeAsk" ADD COLUMN IF NOT EXISTS "service" TEXT NOT NULL DEFAULT ''`))
    .then(() => db.query(`ALTER TABLE "HomeAsk" ADD COLUMN IF NOT EXISTS "industry" TEXT NOT NULL DEFAULT ''`))
    .then(() => db.query(`ALTER TABLE "HomeAsk" ADD COLUMN IF NOT EXISTS "learnable" BOOLEAN NOT NULL DEFAULT FALSE`))
    .then(() => db.query(`ALTER TABLE "HomeAsk" ADD COLUMN IF NOT EXISTS "standard" BOOLEAN NOT NULL DEFAULT FALSE`))
    .then(() => db.query(`ALTER TABLE "HomeAsk" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT FALSE`))
    .then(() => db.query(`CREATE INDEX IF NOT EXISTS "HomeAsk_createdAt_idx" ON "HomeAsk" ("createdAt" DESC)`))
    .then(() => undefined)
    .catch((error) => {
      ready = null;
      throw error;
    });
  return ready;
}

function asText(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function asBool(value: unknown) {
  return value === true;
}

function hydrate(row: HomeAsk): HomeAsk {
  const kind = classifyQuestion(row.question);
  return {
    ...row,
    service: row.service || kind.service,
    industry: row.industry || kind.industry,
    learnable: learnableAnswer(row.answer),
    standard: row.standard,
    locked: row.locked,
  };
}

function fromDb(row: Record<string, unknown>): HomeAsk {
  return hydrate({
    id: asText(row.id),
    question: asText(row.question),
    answer: asText(row.answer),
    needsInquiry: asBool(row.needsInquiry),
    approved: asText(row.approved),
    service: asText(row.service),
    industry: asText(row.industry),
    learnable: asBool(row.learnable),
    standard: asBool(row.standard),
    locked: asBool(row.locked),
    createdAt: asText(row.createdAt),
    approvedAt: asText(row.approvedAt),
  });
}

async function readFileRows() {
  try {
    const text = await readFile(filePath, "utf8");
    const parsed = JSON.parse(text) as Partial<HomeAsk>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => fromDb(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

async function writeFileRows(rows: HomeAsk[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(rows, null, 2));
}

export async function recordAsk(input: { question: string; answer: string; needsInquiry: boolean }) {
  const question = publicWords(input.question).slice(0, 800);
  const answer = publicWords(input.answer).slice(0, 1200);
  if (question.length < 2 || answer.length < 2) return null;
  const kind = classifyQuestion(question);
  const row: HomeAsk = {
    id: `ask-${randomUUID()}`,
    question,
    answer,
    needsInquiry: input.needsInquiry,
    approved: "",
    service: kind.service,
    industry: kind.industry,
    learnable: learnableAnswer(answer),
    standard: false,
    locked: false,
    createdAt: new Date().toISOString(),
    approvedAt: "",
  };
  if (useDatabase()) {
    const db = getPool();
    if (!db) return null;
    await ensureTable();
    await db.query(
      `INSERT INTO "HomeAsk" ("id", "question", "answer", "needsInquiry", "approved", "service", "industry", "learnable", "standard", "locked", "createdAt")
       VALUES ($1, $2, $3, $4, '', $5, $6, $7, FALSE, FALSE, $8)`,
      [row.id, row.question, row.answer, row.needsInquiry, row.service, row.industry, row.learnable, row.createdAt],
    );
    return row;
  }
  const rows = await readFileRows();
  rows.push(row);
  await writeFileRows(rows);
  return row;
}

export async function listAsks(limit = 200) {
  if (useDatabase()) {
    const db = getPool();
    if (!db) return [];
    await ensureTable();
    const result = await db.query(`SELECT * FROM "HomeAsk" ORDER BY "createdAt" DESC LIMIT $1`, [limit]);
    return result.rows.map((row) => fromDb(row as Record<string, unknown>));
  }
  const rows = await readFileRows();
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
}

function remember(row: HomeAsk): HomeReply {
  return {
    question: row.question.slice(0, 300),
    answer: (row.approved.trim() || row.answer).slice(0, 500),
  };
}

export async function matchingMemory(message: string): Promise<HomeReply[]> {
  const rows = await listAsks(500);
  const standards = rows.filter((row) => row.standard && row.approved.trim() && cardsMatch(message, row.question));
  if (standards.length > 0) return standards.slice(0, 3).map(remember);
  return rows
    .filter((row) => row.learnable && nearbyCard(message, row.question))
    .slice(0, 3)
    .map(remember);
}

export async function lockedStandards(message: string): Promise<HomeReply[]> {
  const rows = await listAsks(500);
  return rows
    .filter((row) => row.locked && row.approved.trim() && cardsMatch(message, row.question))
    .slice(0, 3)
    .map(remember);
}

export async function promoteStandards() {
  const rows = await listAsks(500);
  const chosen = chooseStandards(rows);
  const changed = rows.filter((row) => !row.locked && row.standard !== Boolean(chosen[row.id]));
  if (changed.length === 0) return;
  for (const row of changed) {
    row.standard = Boolean(chosen[row.id]);
    if (row.standard && !row.approved.trim()) row.approved = row.answer;
    if (!row.standard && !row.locked) row.approved = "";
  }
  if (useDatabase()) {
    const db = getPool();
    if (!db) return;
    await ensureTable();
    for (const row of changed) {
      await db.query(`UPDATE "HomeAsk" SET "standard" = $2, "approved" = $3 WHERE "id" = $1 AND "locked" = FALSE`, [
        row.id,
        row.standard,
        row.standard ? row.approved : "",
      ]);
    }
    return;
  }
  const stored = await readFileRows();
  const byId = new Map(changed.map((row) => [row.id, row]));
  await writeFileRows(stored.map((row) => byId.get(row.id) ?? row));
}

export async function saveApprovedAsk(id: string, approved: string) {
  const text = publicWords(approved).slice(0, 1200);
  const approvedAt = new Date().toISOString();
  if (useDatabase()) {
    const db = getPool();
    if (!db) return null;
    await ensureTable();
    const result = await db.query(
      `UPDATE "HomeAsk" SET "approved" = $2, "approvedAt" = $3, "locked" = TRUE, "standard" = TRUE WHERE "id" = $1 RETURNING *`,
      [id, text, approvedAt],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? fromDb(row) : null;
  }
  const rows = await readFileRows();
  const row = rows.find((item) => item.id === id);
  if (!row) return null;
  row.approved = text;
  row.approvedAt = approvedAt;
  row.locked = true;
  row.standard = true;
  await writeFileRows(rows);
  return row;
}
