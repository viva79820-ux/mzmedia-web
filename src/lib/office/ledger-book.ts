import { prisma } from "@/lib/db";
import type { LedgerDraft } from "@/lib/office/ledger";

export async function applyLedger(draft: LedgerDraft) {
  if (draft.action === "cash") {
    await prisma.osSetting.upsert({
      where: { key: "cash_on_hand" },
      update: { value: String(draft.amount) },
      create: { key: "cash_on_hand", value: String(draft.amount) },
    });
    return `${draft.summary} 대시보드의 가용 현금에 반영했습니다.`;
  }

  if (draft.action === "cost") {
    await prisma.costItem.create({
      data: {
        label: draft.label,
        category: draft.category,
        amount: draft.amount,
        spentAt: draft.spentAt,
        memo: draft.recurring ? "매월" : "",
      },
    });
    return `${draft.summary} 지출에 넣었습니다.`;
  }

  const projects = await prisma.project.findMany({
    include: { customer: { select: { companyName: true } } },
    take: 200,
  });
  const hits = projects.filter((project) => {
    const customer = project.customer.companyName;
    return customer.includes(draft.customer) || draft.customer.includes(customer) || project.name.includes(draft.customer);
  });
  const projectId = hits.length === 1 ? hits[0].id : null;
  const note =
    hits.length === 1 ? "" : hits.length > 1 ? "같은 이름의 프로젝트가 여러 곳이라 프로젝트에 연결하지 않았습니다." : "연결된 프로젝트가 없어 고객명만 남겼습니다.";

  if (draft.received && projectId) {
    const open = await prisma.payment.findFirst({
      where: { projectId, kind: draft.kind, status: { in: ["PLANNED", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
    });
    if (open) {
      await prisma.payment.update({
        where: { id: open.id },
        data: {
          status: "PAID",
          paidAt: draft.date,
          amount: draft.amount,
          label: draft.label || open.label,
          memo: [draft.customer, note].filter(Boolean).join(" "),
        },
      });
      return `${draft.summary} 있던 일정을 입금 완료로 바꿨습니다.`;
    }
  }

  await prisma.payment.create({
    data: {
      projectId,
      label: draft.label,
      kind: draft.kind,
      amount: draft.amount,
      dueDate: draft.date,
      paidAt: draft.received ? draft.date : "",
      status: draft.received ? "PAID" : "PLANNED",
      memo: [draft.customer, note].filter(Boolean).join(" "),
    },
  });
  return `${draft.summary} 수금·미수에 넣었습니다. ${note}`.trim();
}
