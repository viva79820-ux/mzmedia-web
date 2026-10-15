import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { StaffRole } from "@/generated/prisma/client";

export const STAFF_COOKIE = "mz_staff";
const STAFF_DAYS = 7;

export type SessionStaff = {
  id: string;
  username: string;
  name: string;
  role: StaffRole;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function hashStaffPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyStaffPassword(
  password: string,
  passwordHash: string,
) {
  return bcrypt.compare(password, passwordHash);
}

export async function createStaffToken(staff: SessionStaff) {
  return new SignJWT({
    username: staff.username,
    name: staff.name,
    role: staff.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(staff.id)
    .setIssuedAt()
    .setExpirationTime(`${STAFF_DAYS}d`)
    .sign(getSecret());
}

export async function verifyStaffToken(
  token: string,
): Promise<SessionStaff | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = payload.sub;
    const username = payload.username;
    const name = payload.name;
    const role = payload.role;
    if (
      typeof id !== "string" ||
      typeof username !== "string" ||
      typeof name !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }
    return { id, username, name, role: role as StaffRole };
  } catch {
    return null;
  }
}

export async function setStaffCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_DAYS * 24 * 60 * 60,
  });
}

export async function clearStaffCookie() {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionStaff(): Promise<SessionStaff | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyStaffToken(token);
  if (!session) return null;

  const staff = await prisma.staff.findUnique({ where: { id: session.id } });
  if (!staff || !staff.active) return null;

  return {
    id: staff.id,
    username: staff.username,
    name: staff.name,
    role: staff.role,
  };
}

export async function requireStaff() {
  const staff = await getSessionStaff();
  if (!staff) throw new Error("UNAUTHORIZED");
  return staff;
}

export async function requireStaffRole(...roles: StaffRole[]) {
  const staff = await requireStaff();
  if (!roles.includes(staff.role)) throw new Error("FORBIDDEN");
  return staff;
}
