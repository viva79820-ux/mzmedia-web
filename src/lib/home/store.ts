import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

export type DeskInquiry = {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  message: string;
  question: string;
  reply: string;
  createdAt: string;
  repliedAt: string;
};

const filePath = path.join(process.cwd(), "data", "home-desk.json");

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
    .query(`CREATE TABLE IF NOT EXISTS "HomeInquiry" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL DEFAULT '',
      "companyName" TEXT NOT NULL DEFAULT '',
      "contactName" TEXT NOT NULL DEFAULT '',
      "phone" TEXT NOT NULL DEFAULT '',
      "email" TEXT NOT NULL DEFAULT '',
      "message" TEXT NOT NULL DEFAULT '',
      "question" TEXT NOT NULL DEFAULT '',
      "reply" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "repliedAt" TIMESTAMPTZ
    )`)
    .then(() => db.query(`CREATE INDEX IF NOT EXISTS "HomeInquiry_userId_createdAt_idx" ON "HomeInquiry" ("userId", "createdAt" DESC)`))
    .then(() => undefined)
    .catch((error) => {
      ready = null;
      throw error;
    });
  return ready;
}

function normalize(row: Partial<DeskInquiry>): DeskInquiry {
  return {
    id: row.id || `inq-${Date.now()}`,
    userId: row.userId || "",
    companyName: row.companyName || "",
    contactName: row.contactName || "",
    phone: row.phone || "",
    email: row.email || "",
    message: row.message || "",
    question: row.question || row.message || "",
    reply: row.reply || "",
    createdAt: row.createdAt || new Date().toISOString(),
    repliedAt: row.repliedAt || "",
  };
}

function asText(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function fromDb(row: Record<string, unknown>): DeskInquiry {
  return normalize({
    id: typeof row.id === "string" ? row.id : "",
    userId: typeof row.userId === "string" ? row.userId : "",
    companyName: typeof row.companyName === "string" ? row.companyName : "",
    contactName: typeof row.contactName === "string" ? row.contactName : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    email: typeof row.email === "string" ? row.email : "",
    message: typeof row.message === "string" ? row.message : "",
    question: typeof row.question === "string" ? row.question : "",
    reply: typeof row.reply === "string" ? row.reply : "",
    createdAt: asText(row.createdAt),
    repliedAt: asText(row.repliedAt),
  });
}

async function readFileRows(): Promise<DeskInquiry[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((row) => normalize(row as Partial<DeskInquiry>)) : [];
  } catch {
    return [];
  }
}

async function writeFileRows(rows: DeskInquiry[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

export function inquiryStatus(row: { reply: string }) {
  return row.reply.trim() ? "답변 완료" : "접수";
}

export async function listInquiries() {
  if (useDatabase()) {
    const db = getPool();
    if (!db) return [];
    await ensureTable();
    const result = await db.query(`SELECT * FROM "HomeInquiry" ORDER BY "createdAt" DESC`);
    return result.rows.map((row) => fromDb(row as Record<string, unknown>));
  }
  const rows = await readFileRows();
  return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listMyInquiries(userId: string) {
  if (useDatabase()) {
    const db = getPool();
    if (!db) return [];
    await ensureTable();
    const result = await db.query(`SELECT * FROM "HomeInquiry" WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [userId]);
    return result.rows.map((row) => fromDb(row as Record<string, unknown>));
  }
  const rows = await listInquiries();
  return rows.filter((row) => row.userId === userId);
}

export async function answeredReplies() {
  try {
    const rows = await listInquiries();
    return rows
      .filter((row) => row.reply.trim())
      .map((row) => ({ question: row.question || row.message, answer: row.reply }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function addInquiry(input: Omit<DeskInquiry, "id" | "reply" | "createdAt" | "repliedAt">) {
  const row: DeskInquiry = {
    ...input,
    id: `inq-${randomUUID()}`,
    reply: "",
    createdAt: new Date().toISOString(),
    repliedAt: "",
  };
  if (useDatabase()) {
    const db = getPool();
    if (!db) throw new Error("DATABASE_URL is not set");
    await ensureTable();
    await db.query(
      `INSERT INTO "HomeInquiry"
        ("id", "userId", "companyName", "contactName", "phone", "email", "message", "question", "reply", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', $9)`,
      [row.id, row.userId, row.companyName, row.contactName, row.phone, row.email, row.message, row.question, row.createdAt],
    );
    return row;
  }
  const rows = await readFileRows();
  rows.push(row);
  await writeFileRows(rows);
  return row;
}

export async function saveReply(id: string, reply: string) {
  const text = reply.trim();
  const repliedAt = new Date().toISOString();
  if (useDatabase()) {
    const db = getPool();
    if (!db) return null;
    await ensureTable();
    const result = await db.query(
      `UPDATE "HomeInquiry" SET "reply" = $2, "repliedAt" = $3 WHERE "id" = $1 RETURNING *`,
      [id, text, repliedAt],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? fromDb(row) : null;
  }
  const rows = await readFileRows();
  const row = rows.find((item) => item.id === id);
  if (!row) return null;
  row.reply = text;
  row.repliedAt = repliedAt;
  await writeFileRows(rows);
  return row;
}
