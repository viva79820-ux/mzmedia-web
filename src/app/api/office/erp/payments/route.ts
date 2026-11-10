import { NextResponse } from "next/server";
import type { PaymentKind, PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { guardOffice } from "@/lib/office/guard";
import { seoulToday } from "@/lib/office/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["DEPOSIT", "MILESTONE", "FINAL", "OTHER"]);
const STATUSES = new Set(["PLANNED", "PAID", "OVERDUE", "CANCELLED"]);

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  const today = seoulToday();
  await prisma.payment.updateMany({
    where: { status: "PLANNED", dueDate: { lt: today, not: "" } },
    data: { status: "OVERDUE" },
  });
  const [payments, projects] = await Promise.all([
    prisma.payment.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { project: { include: { customer: { select: { companyName: true } } } } },
      take: 400,
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { customer: { select: { companyName: true } } },
      take: 200,
    }),
  ]);
  return NextResponse.json({
    payments: payments.map((payment) => ({
      ...payment,
      outstanding: payment.status === "PAID" || payment.status === "CANCELLED" ? 0 : payment.amount,
    })),
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      customer: project.customer.companyName,
    })),
  });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, unknown>;
  const amount = Math.max(0, Math.round(Number(body.amount) || 0));
  if (!amount) return NextResponse.json({ error: "금액을 입력해 주세요." }, { status: 400 });
  const payment = await prisma.payment.create({
    data: {
      projectId: body.projectId ? String(body.projectId) : null,
      label: String(body.label ?? "").slice(0, 80),
      kind: KINDS.has(String(body.kind)) ? (String(body.kind) as PaymentKind) : "OTHER",
      amount,
      dueDate: String(body.dueDate ?? ""),
      status: "PLANNED",
    },
  });
  return NextResponse.json({ ok: true, payment });
}

export async function PATCH(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  if (!id || !STATUSES.has(String(body.status))) {
    return NextResponse.json({ error: "수금 상태를 확인해 주세요." }, { status: 400 });
  }
  const status = String(body.status) as PaymentStatus;
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? String(body.paidAt ?? "") || seoulToday() : "",
    },
  });
  return NextResponse.json({ ok: true, payment });
}
