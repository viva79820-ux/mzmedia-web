import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  LEAD_SOURCE_LABEL,
  canSeeReports,
  formatWon,
  monthPrefix,
} from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canSeeReports(staff)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get("month") || monthPrefix();

    const [payments, projects, costs, leadsBySource] = await Promise.all([
      prisma.payment.findMany({
        where: { status: "PAID", paidAt: { startsWith: month } },
        include: { project: true },
      }),
      prisma.project.findMany({
        where: { createdAt: { gte: new Date(`${month}-01`) } },
        select: {
          id: true,
          name: true,
          contractAmount: true,
          serviceCategory: true,
          channelSource: true,
          status: true,
        },
      }),
      prisma.costItem.findMany({
        where: {
          OR: [
            { spentAt: { startsWith: month } },
            { AND: [{ spentAt: "" }, { createdAt: { gte: new Date(`${month}-01`) } }] },
          ],
        },
        include: { project: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        _count: true,
        _sum: { expectedAmount: true },
      }),
    ]);

    const revenueByService: Record<string, number> = {};
    const revenueByChannel: Record<string, number> = {};
    let monthRevenue = 0;
    for (const pay of payments) {
      monthRevenue += pay.amount;
      const service = pay.project?.serviceCategory || "기타";
      const channel = pay.project?.channelSource || "OTHER";
      revenueByService[service] = (revenueByService[service] ?? 0) + pay.amount;
      revenueByChannel[channel] =
        (revenueByChannel[channel] ?? 0) + pay.amount;
    }

    const contractByService: Record<string, number> = {};
    const contractByChannel: Record<string, number> = {};
    let newContractAmount = 0;
    for (const p of projects) {
      newContractAmount += p.contractAmount;
      const service = p.serviceCategory || "기타";
      const channel = p.channelSource || "OTHER";
      contractByService[service] =
        (contractByService[service] ?? 0) + p.contractAmount;
      contractByChannel[channel] =
        (contractByChannel[channel] ?? 0) + p.contractAmount;
    }

    const costByCategory: Record<string, number> = {};
    let monthCost = 0;
    for (const c of costs) {
      monthCost += c.amount;
      costByCategory[c.category] = (costByCategory[c.category] ?? 0) + c.amount;
    }

    // Project P&L snapshot (all open + recent)
    const projectRows = await prisma.project.findMany({
      where: { status: { not: "CLOSED" } },
      include: {
        payments: true,
        costs: true,
        customer: true,
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });

    const projectPnl = projectRows.map((p) => {
      const paid = p.payments
        .filter((x) => x.status === "PAID")
        .reduce((s, x) => s + x.amount, 0);
      const cost = p.costs.reduce((s, x) => s + x.amount, 0);
      const profit = paid - cost;
      const margin =
        paid > 0 ? Math.round((profit / paid) * 1000) / 10 : null;
      return {
        id: p.id,
        name: p.name,
        customer: p.customer.companyName,
        contractAmount: p.contractAmount,
        paid,
        cost,
        profit,
        margin,
        serviceCategory: p.serviceCategory,
        channelSource: p.channelSource,
      };
    });

    return NextResponse.json({
      ok: true,
      month,
      summary: {
        monthRevenue,
        monthRevenueLabel: formatWon(monthRevenue),
        newContractAmount,
        newContractAmountLabel: formatWon(newContractAmount),
        monthCost,
        monthCostLabel: formatWon(monthCost),
        monthProfit: monthRevenue - monthCost,
        monthProfitLabel: formatWon(monthRevenue - monthCost),
      },
      revenueByService: Object.entries(revenueByService)
        .map(([key, amount]) => ({ key: key || "기타", amount }))
        .sort((a, b) => b.amount - a.amount),
      revenueByChannel: Object.entries(revenueByChannel)
        .map(([key, amount]) => ({
          key,
          label:
            LEAD_SOURCE_LABEL[key as keyof typeof LEAD_SOURCE_LABEL] ?? key,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
      contractByService: Object.entries(contractByService)
        .map(([key, amount]) => ({ key: key || "기타", amount }))
        .sort((a, b) => b.amount - a.amount),
      contractByChannel: Object.entries(contractByChannel)
        .map(([key, amount]) => ({
          key,
          label:
            LEAD_SOURCE_LABEL[key as keyof typeof LEAD_SOURCE_LABEL] ?? key,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount),
      costByCategory: Object.entries(costByCategory)
        .map(([key, amount]) => ({ key, amount }))
        .sort((a, b) => b.amount - a.amount),
      leadsBySource: leadsBySource.map((row) => ({
        source: row.source,
        label: LEAD_SOURCE_LABEL[row.source],
        count: row._count,
        expectedAmount: row._sum.expectedAmount ?? 0,
      })),
      projectPnl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
