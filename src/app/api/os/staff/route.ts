import { NextResponse } from "next/server";
import type { StaffRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canManageStaff } from "@/lib/os";
import {
  hashStaffPassword,
  requireStaff,
  requireStaffRole,
} from "@/lib/staff-auth";

export const runtime = "nodejs";

const ROLES = new Set([
  "SUPER_ADMIN",
  "MANAGER",
  "EMPLOYEE",
  "FREELANCER",
  "ACCOUNTING",
]);

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canManageStaff(staff)) {
      // employees can list active staff for assignee pickers
      const list = await prisma.staff.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          active: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ staff: list });
    }
    const list = await prisma.staff.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        department: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ staff: list });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const body = (await request.json()) as Record<string, unknown>;
    const username = String(body.username ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    if (!username || !password || !name || password.length < 4) {
      return NextResponse.json(
        { ok: false, message: "아이디·이름·비밀번호(4자 이상)는 필수입니다." },
        { status: 400 },
      );
    }
    const role = ROLES.has(String(body.role))
      ? (String(body.role) as StaffRole)
      : "EMPLOYEE";

    const created = await prisma.staff.create({
      data: {
        username,
        passwordHash: await hashStaffPassword(password),
        name,
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        role,
        department: String(body.department ?? ""),
        active: body.active !== false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
    });
    return NextResponse.json({ ok: true, staff: created });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) data.email = String(body.email);
    if (body.phone !== undefined) data.phone = String(body.phone);
    if (body.department !== undefined) data.department = String(body.department);
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.role !== undefined && ROLES.has(String(body.role))) {
      data.role = String(body.role) as StaffRole;
    }
    if (body.password && String(body.password).length >= 4) {
      data.passwordHash = await hashStaffPassword(String(body.password));
    }

    const updated = await prisma.staff.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
    });
    return NextResponse.json({ ok: true, staff: updated });
  } catch (error) {
    return fail(error);
  }
}
