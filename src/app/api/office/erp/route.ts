import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardOffice } from "@/lib/office/guard";
import { ensureRecurringCosts } from "@/lib/office/erp";
import { addDays, seoulToday, won } from "@/lib/office/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;

  const today = seoulToday();
  const month = today.slice(0, 7);
  const soon = addDays(today, 3);
  const horizon = addDays(today, 30);
  await ensureRecurringCosts();
  await prisma.payment.updateMany({
    where: { status: "PLANNED", dueDate: { lt: today, not: "" } },
    data: { status: "OVERDUE" },
  });

  const [payments, costs, cashRow, dueSoon, overdueProjects] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { project: { include: { customer: { select: { companyName: true } } } } },
      take: 2000,
    }),
    prisma.costItem.findMany({ take: 2000 }),
    prisma.osSetting.findUnique({ where: { key: "cash_on_hand" } }),
    prisma.project.findMany({
      where: {
        status: { notIn: ["CLOSED", "DELIVERED"] },
        dueDate: { gte: today, lte: soon, not: "" },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { customer: { select: { companyName: true } } },
    }),
    prisma.project.findMany({
      where: {
        status: { notIn: ["CLOSED", "DELIVERED"] },
        dueDate: { lt: today, not: "" },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { customer: { select: { companyName: true } } },
    }),
  ]);

  let confirmedSales = 0;
  let actualDeposits = 0;
  let receivable = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let confirmedIn = 0;
  let delayedIn = 0;
  for (const payment of payments) {
    if (payment.dueDate.startsWith(month)) confirmedSales += payment.amount;
    if (payment.status === "PAID" && payment.paidAt.startsWith(month)) {
      actualDeposits += payment.amount;
    }
    if (payment.status === "PAID") continue;
    receivable += payment.amount;
    const overdue = payment.status === "OVERDUE" || (payment.dueDate !== "" && payment.dueDate < today);
    if (overdue) {
      overdueAmount += payment.amount;
      overdueCount += 1;
      delayedIn += payment.amount;
    } else if (payment.dueDate !== "" && payment.dueDate <= horizon) {
      confirmedIn += payment.amount;
    }
  }

  let operatingExpense = 0;
  let financeOutflow = 0;
  let confirmedOut = 0;
  let expectedOut = 0;
  for (const cost of costs) {
    const inMonth = cost.spentAt.startsWith(month);
    const inHorizon = cost.spentAt !== "" && cost.spentAt >= today && cost.spentAt <= horizon;
    const finance = cost.category === "금융지출";
    if (inMonth && !finance) operatingExpense += cost.amount;
    if (inMonth && finance) financeOutflow += cost.amount;
    if (!inHorizon) continue;
    expectedOut += cost.amount;
    if (cost.category === "고정비" || cost.category === "세금·보험" || finance) {
      confirmedOut += cost.amount;
    }
  }

  const cashKnown = Boolean(cashRow && cashRow.value !== "");
  const cash = cashKnown ? Number(cashRow?.value) || 0 : null;
  const balance = (inflow: number, outflow: number) =>
    cash === null ? null : cash + inflow - outflow;

  const overduePayments = payments
    .filter((payment) => payment.status !== "PAID" && payment.dueDate !== "" && payment.dueDate < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8)
    .map((payment) => ({
      id: payment.id,
      label: payment.label,
      kind: payment.kind,
      dueDate: payment.dueDate,
      amount: payment.amount,
      project: payment.project?.name ?? "",
      customer: payment.project?.customer.companyName ?? "",
    }));

  return NextResponse.json({
    month,
    today,
    horizon,
    cash,
    cashLabel: cash === null ? "미입력" : won(cash),
    confirmedSales,
    confirmedSalesLabel: won(confirmedSales),
    actualDeposits,
    actualDepositsLabel: won(actualDeposits),
    operatingExpense,
    operatingExpenseLabel: won(operatingExpense),
    financeOutflow,
    financeOutflowLabel: won(financeOutflow),
    receivable,
    receivableLabel: won(receivable),
    overdueAmount,
    overdueCount,
    confirmedIn,
    expectedIn: confirmedIn + delayedIn,
    confirmedBalance: balance(confirmedIn, confirmedOut),
    expectedBalance: balance(confirmedIn + delayedIn, expectedOut),
    confirmedBalanceLabel:
      cash === null ? "현금 입력 전" : won(balance(confirmedIn, confirmedOut) ?? 0),
    expectedBalanceLabel:
      cash === null ? "현금 입력 전" : won(balance(confirmedIn + delayedIn, expectedOut) ?? 0),
    overduePayments,
    dueSoon,
    overdueProjects,
  });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json()) as { cash?: unknown };
  const cash = Math.round(Number(body.cash));
  if (!Number.isFinite(cash) || cash < 0) {
    return NextResponse.json({ error: "가용 현금을 원 단위로 입력해 주세요." }, { status: 400 });
  }
  await prisma.osSetting.upsert({
    where: { key: "cash_on_hand" },
    create: { key: "cash_on_hand", value: String(cash) },
    update: { value: String(cash) },
  });
  return NextResponse.json({ ok: true });
}
