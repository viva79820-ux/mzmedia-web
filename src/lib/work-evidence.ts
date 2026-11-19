import { prisma } from "@/lib/db";
import { readDriveText } from "@/lib/drive";
import type { SessionStaff } from "@/lib/staff-auth";

function production(staff: SessionStaff) {
  return staff.role === "EMPLOYEE" || staff.role === "FREELANCER";
}

function withoutMoney(text: string) {
  return text
    .replace(/\d[\d,]*\s*원/g, "")
    .replace(/(단가|견적|계약금액|합계|원가|급여)[^\n。]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function evidenceLines(staff: SessionStaff) {
  const own = production(staff);
  const ceo = staff.role === "SUPER_ADMIN";
  const [slots, inbox, projects, payments, drafts] = await Promise.all([
    prisma.workSlot.findMany({
      where: own ? { assigneeId: staff.id } : {},
      include: { assignee: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.inboxItem.findMany({
      where: own ? { assigneeId: staff.id } : {},
      include: { assignee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    own
      ? Promise.resolve([])
      : prisma.project.findMany({
          include: { customer: { select: { companyName: true } } },
          take: 100,
        }),
    own
      ? Promise.resolve([])
      : prisma.payment.findMany({
          where: { status: { in: ["PLANNED", "OVERDUE", "PAID"] } },
          include: { project: { include: { customer: { select: { companyName: true } } } } },
          take: 200,
        }),
    prisma.officeDraft.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
  ]);

  const lines: string[] = [];
  for (const slot of slots) {
    lines.push(`달력 일정 ${slot.date} 고객사 ${slot.customerName} 업무 ${slot.title} 담당 ${slot.assignee.name} 상태 ${slot.status}`);
  }
  const driveUrls: Array<{ customerName: string; url: string }> = [];
  for (const item of inbox) {
    lines.push(
      `업무 고객사 ${item.customerName} 작업 ${item.title} 내용 ${item.detail} 수량 ${item.quantity}건 완료 기준 ${item.doneCriteria} 해당 월 ${item.month} 담당 ${item.assignee?.name || "없음"} 날짜 ${item.startDate || "없음"} 자료 ${item.driveUrl || "없음"}`,
    );
    if (item.driveUrl) driveUrls.push({ customerName: item.customerName, url: item.driveUrl });
  }
  for (const project of projects) {
    const base = `프로젝트 고객사 ${project.customer.companyName} 이름 ${project.name} 납기 ${project.dueDate || "없음"}`;
    lines.push(ceo ? `${base} 계약금액 ${project.contractAmount}원` : base);
  }
  const byCustomer = new Map<string, { unpaid: boolean; paid: boolean; amounts: string[] }>();
  for (const payment of payments) {
    const name = payment.project?.customer.companyName;
    if (!name) continue;
    const row = byCustomer.get(name) ?? { unpaid: false, paid: false, amounts: [] };
    if (payment.status === "PAID") row.paid = true;
    if (payment.status === "PLANNED" || payment.status === "OVERDUE") {
      row.unpaid = true;
      if (ceo) row.amounts.push(`${payment.amount}원`);
    }
    byCustomer.set(name, row);
  }
  for (const [name, row] of byCustomer) {
    if (ceo) {
      lines.push(`고객사 ${name} 미수 ${row.unpaid ? "있음" : "없음"} ${row.amounts.join(" ")}`.trim());
    } else if (row.unpaid) {
      lines.push(`고객사 ${name} 미수 있음`);
    } else if (row.paid) {
      lines.push(`고객사 ${name} 미수 없음`);
    }
  }

  if (!own) {
    for (const draft of drafts) {
      const text = ceo ? draft.body : withoutMoney(draft.body);
      if (text) lines.push(`문서 초안 고객사 ${draft.customerName} ${draft.kind} ${text}`);
    }
  }

  const seen = new Set<string>();
  for (const link of driveUrls) {
    if (seen.has(link.url) || seen.size >= 4) continue;
    seen.add(link.url);
    const text = await readDriveText(link.url);
    const visible = ceo ? text : withoutMoney(text);
    if (visible) lines.push(`드라이브 문서 고객사 ${link.customerName} ${visible}`);
  }
  return lines;
}
