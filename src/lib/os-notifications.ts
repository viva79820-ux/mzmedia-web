import { prisma } from "@/lib/db";
import { todayKey } from "@/lib/os";

/** Refresh in-app alerts for managers (due projects, overdue payments, next contacts). */
export async function refreshOsNotifications() {
  const today = todayKey();
  const managers = await prisma.staff.findMany({
    where: {
      active: true,
      role: { in: ["SUPER_ADMIN", "MANAGER", "ACCOUNTING"] },
    },
    select: { id: true },
  });
  if (managers.length === 0) return { created: 0 };

  const [dueProjects, overduePayments, nextContacts, dueTasks] =
    await Promise.all([
      prisma.project.findMany({
        where: {
          status: { notIn: ["CLOSED", "DELIVERED"] },
          dueDate: { lte: today, not: "" },
        },
        take: 20,
        include: { customer: true },
      }),
      prisma.payment.findMany({
        where: {
          OR: [
            { status: "OVERDUE" },
            { status: "PLANNED", dueDate: { lt: today, not: "" } },
          ],
        },
        take: 20,
        include: { project: true },
      }),
      prisma.lead.findMany({
        where: {
          nextContactDate: { lte: today, not: "" },
          stage: { notIn: ["WON", "LOST"] },
        },
        take: 20,
        include: { customer: true },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
          dueDate: { lte: today, not: "" },
        },
        take: 20,
        include: { assignee: true },
      }),
    ]);

  // Clear unread auto alerts older than today refresh window (keep read ones)
  await prisma.osNotification.deleteMany({
    where: {
      readAt: null,
      kind: {
        in: ["DUE_PROJECT", "OVERDUE_PAYMENT", "NEXT_CONTACT", "TASK_DUE"],
      },
      createdAt: {
        lt: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const existing = await prisma.osNotification.findMany({
    where: {
      readAt: null,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    select: { title: true, staffId: true, kind: true },
  });
  const existingKey = new Set(
    existing.map((n) => `${n.staffId}:${n.kind}:${n.title}`),
  );

  const rows: {
    staffId: string;
    kind: "DUE_PROJECT" | "OVERDUE_PAYMENT" | "NEXT_CONTACT" | "TASK_DUE";
    title: string;
    body: string;
    href: string;
  }[] = [];

  for (const manager of managers) {
    for (const p of dueProjects) {
      const title = `납기 임박/지연: ${p.name}`;
      const key = `${manager.id}:DUE_PROJECT:${title}`;
      if (existingKey.has(key)) continue;
      rows.push({
        staffId: manager.id,
        kind: "DUE_PROJECT",
        title,
        body: `${p.customer.companyName} · 마감 ${p.dueDate}`,
        href: `/os/projects/${p.id}`,
      });
    }
    for (const pay of overduePayments) {
      const title = `미수금: ${pay.label || pay.kind} ${pay.amount.toLocaleString("ko-KR")}원`;
      const key = `${manager.id}:OVERDUE_PAYMENT:${title}`;
      if (existingKey.has(key)) continue;
      rows.push({
        staffId: manager.id,
        kind: "OVERDUE_PAYMENT",
        title,
        body: `${pay.project?.name ?? "프로젝트 없음"} · 예정 ${pay.dueDate}`,
        href: "/os/finance/payments",
      });
    }
    for (const lead of nextContacts) {
      const title = `다음 연락: ${lead.title}`;
      const key = `${manager.id}:NEXT_CONTACT:${title}`;
      if (existingKey.has(key)) continue;
      rows.push({
        staffId: manager.id,
        kind: "NEXT_CONTACT",
        title,
        body: `${lead.customer.companyName} · ${lead.nextContactDate}`,
        href: "/os/leads",
      });
    }
  }

  // Task due alerts go to assignee (or managers if unassigned)
  for (const task of dueTasks) {
    const targets = task.assigneeId
      ? [{ id: task.assigneeId }]
      : managers;
    for (const target of targets) {
      const title = `업무 마감: ${task.title}`;
      const key = `${target.id}:TASK_DUE:${title}`;
      if (existingKey.has(key)) continue;
      rows.push({
        staffId: target.id,
        kind: "TASK_DUE",
        title,
        body: `마감 ${task.dueDate}`,
        href: "/os/tasks",
      });
    }
  }

  if (rows.length > 0) {
    await prisma.osNotification.createMany({ data: rows });
  }
  return { created: rows.length };
}
