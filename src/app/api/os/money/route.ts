import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canSeeAmounts, monthPrefix, todayKey } from "@/lib/os";
import { receivableByCustomer } from "@/lib/money-view";
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
    if (staff.role === "EMPLOYEE" || staff.role === "FREELANCER") {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const today = todayKey();
    const month = monthPrefix();
    const payments = await prisma.payment.findMany({
      where: { status: { in: ["PLANNED", "OVERDUE", "PAID"] } },
      include: { project: { include: { customer: { select: { companyName: true } } } } },
      orderBy: { dueDate: "asc" },
      take: 400,
    });
    if (!canSeeAmounts(staff)) {
      return NextResponse.json({
        amounts: false,
        customers: receivableByCustomer(
          payments.map((payment) => ({
            customerName: payment.project?.customer.companyName ?? "",
            status: payment.status,
          })),
        ),
      });
    }
    const row = (payment: (typeof payments)[number]) => ({
      id: payment.id,
      customerName: payment.project?.customer.companyName ?? "고객사 없음",
      label: payment.label,
      amount: payment.amount,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
      status: payment.status,
    });
    const open = payments.filter((payment) => payment.status === "PLANNED" || payment.status === "OVERDUE");
    return NextResponse.json({
      amounts: true,
      unpaid: open.map(row),
      overdue: open.filter((payment) => payment.status === "OVERDUE" || (payment.dueDate && payment.dueDate < today)).map(row),
      paidThisMonth: payments.filter((payment) => payment.status === "PAID" && payment.paidAt.startsWith(month)).map(row),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canSeeAmounts(staff)) return NextResponse.json({ ok: false }, { status: 403 });
    const body = (await request.json()) as { id?: string };
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: todayKey() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
