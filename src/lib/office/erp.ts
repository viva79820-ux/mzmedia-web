import { prisma } from "@/lib/db";
import { addDays, nextMonth, seoulToday } from "@/lib/office/money";

export async function ensureRecurringCosts() {
  const today = seoulToday();
  const horizon = addDays(today, 40);
  const rows = await prisma.costItem.findMany({
    where: { memo: { contains: "매월" } },
    orderBy: { spentAt: "desc" },
  });
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = `${row.label}|${row.projectId ?? ""}|${row.category}`;
    const current = latest.get(key);
    if (!current || row.spentAt > current.spentAt) latest.set(key, row);
  }
  for (const row of latest.values()) {
    if (!row.spentAt || row.amount <= 0) continue;
    const upcoming = nextMonth(row.spentAt);
    if (upcoming > horizon) continue;
    const exists = await prisma.costItem.findFirst({
      where: {
        label: row.label,
        projectId: row.projectId,
        category: row.category,
        spentAt: upcoming,
      },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.costItem.create({
      data: {
        projectId: row.projectId,
        label: row.label,
        category: row.category,
        amount: row.amount,
        spentAt: upcoming,
        memo: "매월",
      },
    });
  }
}
