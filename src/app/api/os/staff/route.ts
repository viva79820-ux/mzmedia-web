import { NextResponse } from "next/server";
import type { StaffRole } from "@/generated/prisma/client";
import { parseCompanyEmail } from "@/lib/company-mail";
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

async function claimCompanyEmail(value: string, exceptId?: string) {
  const parsed = parseCompanyEmail(value);
  if (!parsed.ok) return parsed;
  const taken = await prisma.staff.findFirst({
    where: {
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
      OR: [{ email: parsed.email }, { username: parsed.email }],
    },
    select: { id: true },
  });
  if (taken) return { ok: false as const, error: "이미 쓰는 회사 메일입니다." };
  return parsed;
}

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
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const claimed = await claimCompanyEmail(String(body.companyLocal ?? body.email ?? ""));
    if (!claimed.ok || !password || !name || password.length < 4) {
      return NextResponse.json(
        { ok: false, message: claimed.ok ? "이름·회사 메일·비밀번호(4자 이상)는 필수입니다." : claimed.error },
        { status: 400 },
      );
    }
    const role = ROLES.has(String(body.role))
      ? (String(body.role) as StaffRole)
      : "EMPLOYEE";

    const created = await prisma.staff.create({
      data: {
        username: claimed.email,
        passwordHash: await hashStaffPassword(password),
        name,
        email: claimed.email,
        phone: String(body.phone ?? ""),
        role,
        department: String(body.department ?? ""),
        active: body.active !== false,
      },
      select: {
        id: true,
        username: true,
        email: true,
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
    if (body.companyLocal !== undefined || body.email !== undefined) {
      const current = await prisma.staff.findUnique({
        where: { id },
        select: { email: true },
      });
      if (!current) return NextResponse.json({ ok: false }, { status: 404 });
      const next = String(body.companyLocal ?? body.email ?? "").trim();
      if (!next) {
        if (current.email.endsWith("@mzmedia.co.kr")) {
          return NextResponse.json(
            { ok: false, message: "회사 메일 주소는 오피스에서 지우지 않습니다. 로그인을 막으려면 비활성화하세요." },
            { status: 400 },
          );
        }
      } else {
        const claimed = await claimCompanyEmail(next, id);
        if (!claimed.ok) {
          return NextResponse.json({ ok: false, message: claimed.error }, { status: 400 });
        }
        data.email = claimed.email;
        data.username = claimed.email;
      }
    }
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
        email: true,
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
