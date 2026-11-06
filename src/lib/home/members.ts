import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type PublicMember = {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string;
};

type StoredMember = PublicMember & {
  passwordHash: string;
  privacyAgreedAt: string;
  termsAgreedAt: string;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "home-members.json");

function localAllowed() {
  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;
}

async function readAll(): Promise<StoredMember[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredMember[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: StoredMember[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

function publicMember(row: StoredMember): PublicMember {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    phone: row.phone,
    email: row.email,
  };
}

export async function registerMember(input: {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
}): Promise<{ ok: true; user: PublicMember } | { ok: false; status: number; message: string }> {
  if (process.env.DATABASE_URL) {
    const existing = await prisma.user.findUnique({ where: { username: input.username } });
    if (existing) return { ok: false, status: 409, message: "이미 사용 중인 아이디입니다." };
    const user = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash: await hashPassword(input.password),
        name: input.name,
        phone: input.phone,
        email: input.email,
        privacyAgreedAt: new Date(),
      },
      select: { id: true, username: true, name: true, phone: true, email: true },
    });
    return { ok: true, user };
  }

  if (!localAllowed()) {
    return { ok: false, status: 500, message: "회원가입을 저장할 준비가 되어 있지 않습니다." };
  }

  const rows = await readAll();
  if (rows.some((row) => row.username === input.username)) {
    return { ok: false, status: 409, message: "이미 사용 중인 아이디입니다." };
  }
  const now = new Date().toISOString();
  const row: StoredMember = {
    id: `mem-${Date.now()}`,
    username: input.username,
    passwordHash: await hashPassword(input.password),
    name: input.name,
    phone: input.phone,
    email: input.email,
    privacyAgreedAt: now,
    termsAgreedAt: now,
    createdAt: now,
  };
  rows.push(row);
  await writeAll(rows);
  return { ok: true, user: publicMember(row) };
}

export async function authenticateMember(username: string, password: string): Promise<PublicMember | null> {
  if (process.env.DATABASE_URL) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return null;
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email,
    };
  }

  if (!localAllowed()) return null;
  const row = (await readAll()).find((item) => item.username === username);
  if (!row || !(await verifyPassword(password, row.passwordHash))) return null;
  return publicMember(row);
}

export async function memberById(id: string): Promise<PublicMember | null> {
  if (process.env.DATABASE_URL) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, phone: true, email: true },
    });
  }
  if (!localAllowed()) return null;
  const row = (await readAll()).find((item) => item.id === id);
  return row ? publicMember(row) : null;
}
