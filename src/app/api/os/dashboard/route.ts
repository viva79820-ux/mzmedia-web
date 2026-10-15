import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  canSeeAllRecords,
  formatWon,
  monthPrefix,
  todayKey,
} from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canSeeAllRecords(staff) && staff.role !== "ACCOUNTING") {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const today = todayKey();
    const month = monthPrefix();
    const monthStart = `${month}-01`;

    const goalRow = await prisma.osSetting.findUnique({
      where: { key: "monthly_revenue_goal" },
    });
    const monthlyGoal = Number(goalRow?.value ?? 30000000) || 30000000;

    const [
      paidThisMonth,
      newContracts,
      leadsByStage,
      projects,
      overduePayments,
      plannedIncoming,
      dueSoonProjects,
      todayTasks,
      staffTaskStats,
      nextContacts,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { startsWith: month } },
        _sum: { amount: true },
      }),
      prisma.project.aggregate({
        where: { createdAt: { gte: new Date(monthStart) } },
        _sum: { contractAmount: true },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["stage"],
        _count: true,
      }),
      prisma.project.findMany({
        where: {
          status: {
            in: ["CONTRACTED", "PREP", "IN_PROGRESS", "REVIEW", "REVISION"],
          },
        },
        select: { id: true, name: true, status: true, dueDate: true },
      }),
      prisma.payment.aggregate({
        where: {
          OR: [
            { status: "OVERDUE" },
            { status: "PLANNED", dueDate: { lt: today, not: "" } },
          ],
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          status: { in: ["PLANNED", "OVERDUE"] },
          dueDate: { startsWith: month },
        },
        _sum: { amount: true },
      }),
      prisma.project.findMany({
        where: {
          status: { notIn: ["CLOSED", "DELIVERED"] },
          dueDate: { lte: today, not: "" },
        },
        take: 8,
        orderBy: { dueDate: "asc" },
        include: { customer: true },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
          OR: [{ dueDate: today }, { dueDate: "" }],
        },
        take: 10,
        orderBy: { priority: "desc" },
        include: { assignee: true, project: true },
      }),
      prisma.staff.findMany({
        where: { active: true, role: { in: ["EMPLOYEE", "MANAGER", "SUPER_ADMIN"] } },
        select: {
          id: true,
          name: true,
          assignedTasks: {
            select: { status: true },
          },
        },
      }),
      prisma.lead.findMany({
        where: {
          nextContactDate: { lte: today, not: "" },
          stage: { notIn: ["WON", "LOST"] },
        },
        take: 8,
        orderBy: { nextContactDate: "asc" },
        include: { customer: true, owner: true },
      }),
    ]);

    const stageMap = Object.fromEntries(
      leadsByStage.map((row) => [row.stage, row._count]),
    ) as Record<string, number>;

    const leadCount = Object.values(stageMap).reduce((a, b) => a + b, 0);
    const won = stageMap.WON ?? 0;
    const consult = stageMap.CONSULT ?? 0;
    const quote = stageMap.QUOTE ?? 0;
    const conversion =
      leadCount > 0 ? Math.round((won / leadCount) * 1000) / 10 : 0;

    const delayedProjects = projects.filter(
      (p) => p.dueDate && p.dueDate < today,
    ).length;
    const activeProjects = projects.length;

    const staffCompletion = staffTaskStats.map((s) => {
      const total = s.assignedTasks.length;
      const done = s.assignedTasks.filter((t) => t.status === "DONE").length;
      return {
        id: s.id,
        name: s.name,
        total,
        done,
        rate: total ? Math.round((done / total) * 100) : 0,
      };
    });

    const revenue = paidThisMonth._sum.amount ?? 0;
    const goalRate = monthlyGoal
      ? Math.round((revenue / monthlyGoal) * 1000) / 10
      : 0;

    return NextResponse.json({
      ok: true,
      summary: {
        month,
        revenue,
        revenueLabel: formatWon(revenue),
        monthlyGoal,
        monthlyGoalLabel: formatWon(monthlyGoal),
        goalRate,
        newContractAmount: newContracts._sum.contractAmount ?? 0,
        newContractCount: newContracts._count,
        expectedIncoming: plannedIncoming._sum.amount ?? 0,
        overdueAmount: overduePayments._sum.amount ?? 0,
        overdueCount: overduePayments._count,
        pipeline: {
          lead: stageMap.LEAD ?? 0,
          contact: stageMap.CONTACT ?? 0,
          consult,
          quote,
          negotiate: stageMap.NEGOTIATE ?? 0,
          won,
          lost: stageMap.LOST ?? 0,
          conversion,
        },
        projects: {
          active: activeProjects,
          delayed: delayedProjects,
          delivered: await prisma.project.count({
            where: { status: { in: ["DELIVERED", "CLOSED"] } },
          }),
        },
      },
      dueSoonProjects,
      todayTasks,
      nextContacts,
      staffCompletion,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
