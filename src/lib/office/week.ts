import { prisma } from "@/lib/db";
import { LEAD_STAGE_LABEL } from "@/lib/os";
import { workBoard } from "@/lib/office/work";
import { getSessionStaff } from "@/lib/staff-auth";

const OPEN_STAGES = ["LEAD", "CONTACT", "CONSULT", "QUOTE", "NEGOTIATE"] as const;
const DAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekdayIndex(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function weekStart(iso: string) {
  const day = weekdayIndex(iso);
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function stageLabel(stage: string) {
  return LEAD_STAGE_LABEL[stage as keyof typeof LEAD_STAGE_LABEL] ?? stage;
}

function meetingNote(stage: string, overdue: boolean) {
  if (overdue) return "날짜를 다시 정합니다.";
  if (stage === "QUOTE" || stage === "NEGOTIATE") return "금액과 범위를 확정합니다.";
  if (stage === "ON_HOLD") return "재개 여부를 정합니다.";
  return "";
}

export async function weekBoard(anchor?: string) {
  const today = seoulToday();
  const start = weekStart(anchor && isIsoDate(anchor) ? anchor : today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return { date, label: DAY_LABEL[weekdayIndex(date)], today: date === today };
  });
  const end = days[6].date;

  const leadSelect = {
    id: true,
    title: true,
    stage: true,
    desiredService: true,
    nextContactDate: true,
    customer: { select: { companyName: true, contactName: true } },
  } as const;

  const [dated, overdueRows, overdueCount, undatedRows, undatedCount, contracts, held, board] = await Promise.all([
    prisma.lead.findMany({
      where: {
        stage: { notIn: ["WON", "LOST"] },
        nextContactDate: { gte: start, lte: end },
      },
      select: leadSelect,
      orderBy: { nextContactDate: "asc" },
      take: 80,
    }),
    prisma.lead.findMany({
      where: {
        stage: { notIn: ["WON", "LOST"] },
        nextContactDate: { lt: start, not: "" },
      },
      select: leadSelect,
      orderBy: { nextContactDate: "asc" },
      take: 12,
    }),
    prisma.lead.count({
      where: {
        stage: { notIn: ["WON", "LOST"] },
        nextContactDate: { lt: start, not: "" },
      },
    }),
    prisma.lead.findMany({
      where: { stage: { in: [...OPEN_STAGES] }, nextContactDate: "" },
      select: leadSelect,
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.lead.count({
      where: { stage: { in: [...OPEN_STAGES] }, nextContactDate: "" },
    }),
    prisma.contract.findMany({
      where: { status: "DRAFT" },
      select: {
        id: true,
        title: true,
        contractAmount: true,
        customer: { select: { companyName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.lead.findMany({
      where: { stage: "ON_HOLD", OR: [{ nextContactDate: "" }, { nextContactDate: { gt: end } }] },
      select: leadSelect,
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    workBoard(),
  ]);

  const toMeeting = (lead: (typeof dated)[number], date: string, overdue: boolean) => ({
    id: lead.id,
    date,
    company: lead.customer.companyName,
    contact: lead.customer.contactName,
    title: lead.title,
    service: lead.desiredService,
    stage: lead.stage,
    stageLabel: stageLabel(lead.stage),
    overdue,
    note: meetingNote(lead.stage, overdue),
  });

  const showOverdue = today >= start && today <= end;
  const meetings = [
    ...dated.map((lead) => toMeeting(lead, lead.nextContactDate, false)),
    ...(showOverdue ? overdueRows.map((lead) => toMeeting(lead, today, true)) : []),
  ];

  return {
    today,
    start,
    end,
    days,
    meetings,
    undated: undatedRows.map((lead) => ({
      id: lead.id,
      company: lead.customer.companyName,
      contact: lead.customer.contactName,
      title: lead.title,
      service: lead.desiredService,
      stageLabel: stageLabel(lead.stage),
    })),
    undatedCount,
    overdueCount,
    decisions: {
      contracts: contracts.map((contract) => ({
        id: contract.id,
        company: contract.customer.companyName,
        title: contract.title,
        amountLabel: `${contract.contractAmount.toLocaleString("ko-KR")}원`,
      })),
      held: held.map((lead) => ({
        id: lead.id,
        company: lead.customer.companyName,
        title: lead.title,
      })),
    },
    exceptions: board.exceptions.slice(0, 12).map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.reason,
      assignee: item.assignee,
      dueDate: item.dueDate,
    })),
    exceptionCount: board.exceptions.length,
  };
}

export async function scheduleConsult(leadId: string, date: string) {
  const today = seoulToday();
  if (!leadId) throw new Error("상담을 고르지 않았습니다.");
  if (!isIsoDate(date) || date < today || date > addDays(today, 60)) {
    throw new Error("오늘부터 60일 안의 날짜를 정해 주세요.");
  }
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, stage: true } });
  if (!lead || lead.stage === "WON" || lead.stage === "LOST") {
    throw new Error("일정에 넣을 상담을 찾을 수 없습니다.");
  }
  const actor = await getSessionStaff();
  await prisma.lead.update({ where: { id: lead.id }, data: { nextContactDate: date } });
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      staffId: actor?.id ?? null,
      body: `대표 일정에 ${date} 상담을 넣었습니다. 고객에게 알리지 않았습니다.`,
    },
  });
  return weekBoard(date);
}
