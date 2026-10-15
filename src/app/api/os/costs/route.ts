import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageFinance, canSeeAllRecords } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

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

export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageFinance(staff) && !canSeeAllRecords(staff)) {
      // project members can see costs of their projects
    }
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const costs = await prisma.costItem.findMany({
      where: projectId
        ? { projectId }
        : canSeeAllRecords(staff) || canManageFinance(staff)
          ? undefined
          : { project: { members: { some: { staffId: staff.id } } } },
      orderBy: { createdAt: "desc" },
      include: { project: { include: { customer: true } } },
      take: 400,
    });
    return NextResponse.json({ costs });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageFinance(staff) && !canSeeAllRecords(staff)) {
      throw new Error("FORBIDDEN");
    }
    const body = (await request.json()) as Record<string, unknown>;
    const label = String(body.label ?? "").trim();
    if (!label) {
      return NextResponse.json(
        { ok: false, message: "비용 항목명은 필수입니다." },
        { status: 400 },
      );
    }
    const cost = await prisma.costItem.create({
      data: {
        projectId: body.projectId ? String(body.projectId) : null,
        label,
        category: String(body.category ?? "기타"),
        amount: Number(body.amount ?? 0) || 0,
        spentAt: String(body.spentAt ?? ""),
        memo: String(body.memo ?? ""),
      },
    });
    return NextResponse.json({ ok: true, cost });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageFinance(staff)) throw new Error("FORBIDDEN");
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.label !== undefined) data.label = String(body.label).trim();
    if (body.category !== undefined) data.category = String(body.category);
    if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
    if (body.spentAt !== undefined) data.spentAt = String(body.spentAt);
    if (body.memo !== undefined) data.memo = String(body.memo);
    if (body.projectId !== undefined) {
      data.projectId = body.projectId ? String(body.projectId) : null;
    }
    const cost = await prisma.costItem.update({ where: { id }, data });
    return NextResponse.json({ ok: true, cost });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageFinance(staff)) throw new Error("FORBIDDEN");
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.costItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
