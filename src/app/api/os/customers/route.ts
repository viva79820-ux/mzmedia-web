import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canSeeAllRecords } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

function unauthorized(error: unknown) {
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
    const customers = await prisma.customer.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { leads: true, projects: true } },
        leads: canSeeAllRecords(staff)
          ? { take: 1, orderBy: { updatedAt: "desc" } }
          : {
              where: { ownerId: staff.id },
              take: 1,
              orderBy: { updatedAt: "desc" },
            },
      },
      take: 300,
    });
    return NextResponse.json({ customers });
  } catch (error) {
    return unauthorized(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const companyName = String(body.companyName ?? "").trim();
    if (!companyName) {
      return NextResponse.json(
        { ok: false, message: "회사명은 필수입니다." },
        { status: 400 },
      );
    }
    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactName: String(body.contactName ?? "").trim(),
        phone: String(body.phone ?? "").trim(),
        email: String(body.email ?? "").trim(),
        memo: String(body.memo ?? "").trim(),
      },
    });
    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    return unauthorized(error);
  }
}
