import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { LEAD_STAGE_LABEL } from "@/lib/os";
import { workBoard } from "@/lib/office/work";

const WATCH = path.join(process.cwd(), "knowledge", "morning_watch.md");

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

function watchLists() {
  const text = readFileSync(WATCH, "utf8");
  const retainers: { name: string; line: string }[] = [];
  const videos: { name: string; line: string }[] = [];
  let section = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("## 반복")) section = "retainer";
    else if (line.startsWith("## 편집")) section = "video";
    else if (line.startsWith("## ")) section = "";
    const row = line.match(/^- (.+?) \| (.+)$/);
    if (!row) continue;
    const item = { name: row[1].trim(), line: row[2].trim() };
    if (section === "retainer") retainers.push(item);
    if (section === "video") videos.push(item);
  }
  return { retainers, videos };
}

export async function morningBoard() {
  const today = seoulToday();
  const day = Number(today.slice(8, 10));
  const weekEnd = addDays(today, 7);
  const watch = watchLists();

  const [leads, payments, staff, contracts, tasks, board] = await Promise.all([
    prisma.lead.findMany({
      where: { nextContactDate: today, stage: { notIn: ["WON", "LOST"] } },
      select: { id: true, title: true, stage: true, customer: { select: { companyName: true } } },
      take: 20,
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PLANNED", "OVERDUE"] } },
      select: {
        id: true,
        label: true,
        amount: true,
        dueDate: true,
        status: true,
        project: { select: { name: true, customer: { select: { companyName: true } } } },
      },
      orderBy: { dueDate: "asc" },
      take: 40,
    }),
    prisma.staff.findMany({
      where: { active: true },
      select: { name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.contract.findMany({
      where: { status: "DRAFT" },
      select: { id: true, title: true, customer: { select: { companyName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        OR: [{ title: { contains: "영상" } }, { title: { contains: "편집" } }, { title: { contains: "촬영" } }],
      },
      select: { id: true, title: true, dueDate: true, assignee: { select: { name: true } } },
      take: 30,
    }),
    workBoard(),
  ]);

  const collections = payments
    .filter((payment) => {
      if (payment.status === "OVERDUE") return true;
      if (!payment.dueDate) return false;
      return payment.dueDate <= weekEnd;
    })
    .slice(0, 12)
    .map((payment) => ({
      id: payment.id,
      company: payment.project?.customer.companyName || payment.project?.name || payment.label || "고객명 확인 필요",
      label: payment.label,
      dueDate: payment.dueDate,
      amountLabel: `${payment.amount.toLocaleString("ko-KR")}원`,
      state: payment.status === "OVERDUE" ? "지급 지연 후보" : "청구 후보",
    }));

  const taskGaps = tasks
    .filter((task) => !task.assignee || task.assignee.name === "김영우")
    .map((task) => ({
      id: task.id,
      name: task.title,
      dueDate: task.dueDate,
      reason: task.assignee?.name === "김영우" ? "대표가 편집 담당으로 적혀 있습니다." : "편집 담당이 없습니다.",
    }));

  const videoGaps = [
    ...watch.videos.map((item) => ({
      id: `watch-${item.name}`,
      name: item.name,
      dueDate: "",
      reason: "편집 담당이 확인되지 않았습니다.",
    })),
    ...taskGaps,
  ];

  return {
    today,
    monthStart: day <= 3,
    paydaySoon: day <= 10,
    meetings: leads.map((lead) => ({
      id: lead.id,
      company: lead.customer.companyName,
      title: lead.title,
      stage: LEAD_STAGE_LABEL[lead.stage],
    })),
    retainers: watch.retainers.map((item) => ({
      name: item.name,
      line: item.line,
      quota: "확인 필요",
      assignee: "확인 필요",
      published: "확인 필요",
    })),
    moonmiyoung:
      "문미영에게 새 고객을 배정하지 않았습니다. 담당 상한은 4곳이고, 지금 담당 고객 수는 확인 필요합니다.",
    videos: videoGaps,
    collections,
    approvals: contracts.map((contract) => ({
      id: contract.id,
      company: contract.customer.companyName,
      title: contract.title || "계약 초안",
    })),
    staff: staff.map((person) => person.name),
    exceptions: board.exceptions.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.reason,
      assignee: item.assignee,
      dueDate: item.dueDate,
    })),
    exceptionCount: board.exceptions.length,
  };
}
