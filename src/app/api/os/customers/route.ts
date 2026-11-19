import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canSeeAmounts } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const office = staff.role === "SUPER_ADMIN" || staff.role === "MANAGER";
    if (!office) {
      const customers = await prisma.customer.findMany({
        orderBy: { companyName: "asc" },
        select: { id: true, companyName: true },
        take: 300,
      });
      return NextResponse.json({ canCreate: false, customers });
    }
    const customers = await prisma.customer.findMany({
      where: staff.role === "MANAGER"
        ? {
            OR: [
              { pmId: staff.id },
              { leads: { some: { ownerId: staff.id, owner: { role: "MANAGER" } } } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        phone: true,
        email: true,
        _count: { select: { leads: true, projects: true } },
      },
      take: 300,
    });
    return NextResponse.json({ canCreate: canSeeAmounts(staff), customers });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canSeeAmounts(staff)) {
      return NextResponse.json({ ok: false, message: "고객사 등록은 대표만 합니다." }, { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const companyName = String(body.companyName ?? "").trim();
    if (!companyName) {
      return NextResponse.json({ ok: false, message: "회사명은 필수입니다." }, { status: 400 });
    }
    const pmId = String(body.pmId ?? "").trim();
    if (pmId) {
      const pm = await prisma.staff.findFirst({ where: { id: pmId, role: "MANAGER", active: true }, select: { id: true } });
      if (!pm) return NextResponse.json({ ok: false, message: "담당 PM을 확인해 주세요." }, { status: 400 });
    }
    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactName: String(body.contactName ?? "").trim(),
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        memo: String(body.memo ?? "").trim(),
        pmId: pmId || null,
      },
    });
    return NextResponse.json({ ok: true, customer: { id: customer.id, companyName: customer.companyName } });
  } catch (error) {
    return fail(error);
  }
}
