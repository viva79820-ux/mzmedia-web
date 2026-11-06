import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { publicWords, type HomeReply } from "@/lib/home/answer";

export type HomeAsk = {
  id: string;
  question: string;
  answer: string;
  needsInquiry: boolean;
  approved: string;
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
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "approvedAt" TIMESTAMPTZ
    )`)
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

function fromDb(row: Record<string, unknown>): HomeAsk {
  return {
    id: asText(row.id),
    question: asText(row.question),
    answer: asText(row.answer),
    needsInquiry: row.needsInquiry === true,
    approved: asText(row.approved),
    createdAt: asText(row.createdAt),
    approvedAt: asText(row.approvedAt),
  };
}

async function readFileRows() {
  try {
    const text = await readFile(filePath, "utf8");
    const parsed = JSON.parse(text) as HomeAsk[];
    return Array.isArray(parsed) ? parsed : [];
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
  const row: HomeAsk = {
    id: `ask-${randomUUID()}`,
    question,
    answer,
    needsInquiry: input.needsInquiry,
    approved: "",
    createdAt: new Date().toISOString(),
    approvedAt: "",
  };
  if (useDatabase()) {
    const db = getPool();
    if (!db) return null;
    await ensureTable();
    await db.query(
      `INSERT INTO "HomeAsk" ("id", "question", "answer", "needsInquiry", "approved", "createdAt")
       VALUES ($1, $2, $3, $4, '', $5)`,
      [row.id, row.question, row.answer, row.needsInquiry, row.createdAt],
    );
    return row;
  }
  const rows = await readFileRows();
  rows.push(row);
  await writeFileRows(rows);
  return row;
}

export async function listAsks() {
  if (useDatabase()) {
    const db = getPool();
    if (!db) return [];
    await ensureTable();
    const result = await db.query(`SELECT * FROM "HomeAsk" ORDER BY "createdAt" DESC LIMIT 200`);
    return result.rows.map((row) => fromDb(row as Record<string, unknown>));
  }
  const rows = await readFileRows();
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 200);
}

const cannedAnswer = "공개된 안내만으로 확정할 수 없습니다";

export async function recentMemory(): Promise<HomeReply[]> {
  const rows = await listAsks();
  return rows
    .filter((row) => row.answer.trim().length >= 20 && !row.answer.includes(cannedAnswer))
    .slice(0, 12)
    .reverse()
    .map((row) => ({ question: row.question.slice(0, 300), answer: (row.approved.trim() || row.answer).slice(0, 500) }));
}

export async function reusableAsks(): Promise<HomeReply[]> {
  const rows = await listAsks();
  return rows
    .filter((row) => row.approved.trim().length >= 2)
    .map((row) => ({ question: row.question, answer: row.approved }));
}

export async function saveApprovedAsk(id: string, approved: string) {
  const text = publicWords(approved).slice(0, 1200);
  const approvedAt = new Date().toISOString();
  if (useDatabase()) {
    const db = getPool();
    if (!db) return null;
    await ensureTable();
    const result = await db.query(
      `UPDATE "HomeAsk" SET "approved" = $2, "approvedAt" = $3 WHERE "id" = $1 RETURNING *`,
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
  await writeFileRows(rows);
  return row;
}
