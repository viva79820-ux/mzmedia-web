import { NextResponse } from "next/server";
import type { PaymentKind, PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canManageFinance, todayKey } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const KINDS = new Set(["DEPOSIT", "MILESTONE", "FINAL", "OTHER"]);
const STATUSES = new Set(["PLANNED", "PAID", "OVERDUE", "CANCELLED"]);

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
    if (!canManageFinance(staff)) throw new Error("FORBIDDEN");

    const today = todayKey();
    // Mark overdue planned payments
    await prisma.payment.updateMany({
      where: {
        status: "PLANNED",
        dueDate: { lt: today, not: "" },
      },
      data: { status: "OVERDUE" },
    });

    const payments = await prisma.payment.findMany({
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { project: { include: { customer: true } } },
      take: 400,
    });
    return NextResponse.json({ payments });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageFinance(staff)) throw new Error("FORBIDDEN");
    const body = (await request.json()) as Record<string, unknown>;
    const amount = Number(body.amount ?? 0) || 0;
    const payment = await prisma.payment.create({
      data: {
        projectId: body.projectId ? String(body.projectId) : null,
        label: String(body.label ?? ""),
        kind: KINDS.has(String(body.kind))
          ? (String(body.kind) as PaymentKind)
          : "OTHER",
        amount,
        dueDate: String(body.dueDate ?? ""),
        paidAt: String(body.paidAt ?? ""),
        status: STATUSES.has(String(body.status))
          ? (String(body.status) as PaymentStatus)
          : "PLANNED",
        memo: String(body.memo ?? ""),
      },
    });
    return NextResponse.json({ ok: true, payment });
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
    if (body.label !== undefined) data.label = String(body.label);
    if (body.kind !== undefined && KINDS.has(String(body.kind))) {
      data.kind = String(body.kind) as PaymentKind;
    }
    if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
    if (body.dueDate !== undefined) data.dueDate = String(body.dueDate);
    if (body.paidAt !== undefined) data.paidAt = String(body.paidAt);
    if (body.status !== undefined && STATUSES.has(String(body.status))) {
      data.status = String(body.status) as PaymentStatus;
      if (body.status === "PAID" && !body.paidAt) {
        data.paidAt = todayKey();
      }
    }
    if (body.memo !== undefined) data.memo = String(body.memo);
    if (body.projectId !== undefined) {
      data.projectId = body.projectId ? String(body.projectId) : null;
    }

    const payment = await prisma.payment.update({ where: { id }, data });
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    return fail(error);
  }
}
