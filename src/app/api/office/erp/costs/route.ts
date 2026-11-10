import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRecurringCosts } from "@/lib/office/erp";
import { COST_CLASSES, seoulToday } from "@/lib/office/money";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  await ensureRecurringCosts();
  const [costs, projects] = await Promise.all([
    prisma.costItem.findMany({
      orderBy: { spentAt: "desc" },
      include: { project: { include: { customer: { select: { companyName: true } } } } },
      take: 400,
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
      take: 200,
    }),
  ]);
  return NextResponse.json({ costs, projects });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, unknown>;
  const label = String(body.label ?? "").trim();
  const amount = Math.max(0, Math.round(Number(body.amount) || 0));
  const category = COST_CLASSES.includes(String(body.category) as (typeof COST_CLASSES)[number])
    ? String(body.category)
    : "변동비";
  if (!label || !amount) {
    return NextResponse.json({ error: "항목과 금액을 입력해 주세요." }, { status: 400 });
  }
  const cost = await prisma.costItem.create({
    data: {
      projectId: body.projectId ? String(body.projectId) : null,
      label: label.slice(0, 80),
      category,
      amount,
      spentAt: String(body.spentAt ?? "") || seoulToday(),
      memo: body.recurring === true ? "매월" : "",
    },
  });
  if (body.recurring === true) await ensureRecurringCosts();
  return NextResponse.json({ ok: true, cost });
}

export async function DELETE(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "항목이 없습니다." }, { status: 400 });
  await prisma.costItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
