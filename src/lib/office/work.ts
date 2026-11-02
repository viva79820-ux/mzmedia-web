import type { TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { addLog, getJob, listJobs } from "@/lib/office/db";
import { getSessionStaff } from "@/lib/staff-auth";

const TEMPLATES = {
  MARKETING_RETAINER: ["월 수량 확인", "초안 제작", "고객 승인 대기", "게시", "월간 보고 초안"],
  VIDEO_PRODUCTION: ["규격과 원본 확인", "구성", "편집", "내부 검수", "시안 문안", "수정", "납품 문안"],
  WEB_APP_DEVELOPMENT: ["요구사항", "기능 목록", "구현", "테스트", "고객 검수", "수정"],
  EQUIPMENT_RENTAL: ["재고 확인", "계약 조건 확인", "출고", "반납일 확인", "반납 확인"],
  EDUCATION_COURSE: ["회차 확인", "강의자료", "출석", "과제", "수료 확인"],
  DESIGN_PRINT: ["규격 확인", "시안", "수정", "최종 파일"],
} as const;

export type BusinessLine = keyof typeof TEMPLATES;

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

function daysBetween(start: string, end: string) {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const from = Date.UTC(ys, ms - 1, ds);
  const to = Date.UTC(ye, me - 1, de);
  return Math.round((to - from) / 86_400_000);
}

export function jobMarker(jobId: string) {
  return `office-job:${jobId}`;
}

function reasonFor(task: { status: TaskStatus; dueDate: string; assigneeId: string | null; memo: string }, today: string) {
  if (task.status !== "DONE" && task.dueDate && task.dueDate < today) return "마감이 지났습니다";
  if (task.status === "HOLD") return "보류 중입니다";
  if (task.status === "REVIEW") return "확인을 기다리고 있습니다";
  const fromOffice = task.memo.startsWith("office-");
  if (fromOffice && !task.assigneeId) return "담당이 없습니다";
  if (fromOffice && !task.dueDate) return "마감이 없습니다";
  return "";
}

export async function workBoard() {
  const today = seoulToday();
  const [tasks, staff, jobs] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "DONE" } },
      include: { assignee: { select: { id: true, name: true } }, project: { select: { name: true } } },
      orderBy: [{ dueDate: "desc" }],
      take: 200,
    }),
    prisma.staff.findMany({
      where: { active: true, role: { in: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    listJobs(20),
  ]);

  const exceptions = tasks
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee?.name ?? "",
      project: task.project?.name ?? "",
      reason: reasonFor(task, today),
    }))
    .filter((task) => task.reason);

  return {
    today,
    exceptions,
    staff,
    packages: jobs
      .filter((job) => job.goal.startsWith("고객 전달 패키지"))
      .map((job) => ({ id: job.id, goal: job.goal, createdAt: job.createdAt })),
  };
}

export async function startProduction(input: {
  jobId?: string;
  title?: string;
  dueDate?: string;
  assigneeId?: string;
  businessLine?: string;
}) {
  const today = seoulToday();
  const job = input.jobId ? await getJob(input.jobId) : null;
  if (input.jobId && !job) throw new Error("전달 패키지를 찾을 수 없습니다.");
  const title = (input.title || job?.goal || "").replace(/^고객 전달 패키지:?\s*/, "").trim();
  if (title.length < 2) throw new Error("작업 이름을 적어 주세요.");
  const businessLine = input.businessLine || "";
  if (!(businessLine in TEMPLATES)) throw new Error("사업 종류를 골라 주세요. 모든 일에 같은 단계를 쓰지 않습니다.");
  const steps = TEMPLATES[businessLine as BusinessLine];

  if (job) {
    const existing = await prisma.task.findFirst({ where: { memo: jobMarker(job.id) } });
    if (existing) return { created: 0, already: true };
  }

  let due = (input.dueDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due < today) due = addDays(today, 14);
  const span = Math.max(1, daysBetween(today, due));
  const assigneeId = input.assigneeId || null;
  if (assigneeId) {
    const staff = await prisma.staff.findFirst({ where: { id: assigneeId, active: true } });
    if (!staff) throw new Error("담당 직원을 찾을 수 없습니다.");
    if (staff.name.replace(/\s/g, "") === "문미영") {
      throw new Error("문미영의 현재 담당 고객 수를 확인하기 전에는 새 고객을 배정하지 않습니다. 상한은 4곳입니다.");
    }
  }
  const actor = await getSessionStaff();

  await prisma.task.createMany({
    data: steps.map((step, index) => ({
      title: `${title} · ${step}`,
      description:
        step === "게시" || step === "시안 문안" || step === "납품 문안"
          ? "문안과 파일만 준비합니다. 고객 발송은 대표가 합니다. 초안을 게시 완료로 보지 않습니다."
          : "이 사업의 단계만 진행합니다. 수량이 없으면 확인 필요로 남깁니다.",
      assigneeId,
      createdById: actor?.id ?? null,
      priority: index === 0 || index === steps.length - 1 ? "HIGH" : "MEDIUM",
      status: "TODO",
      startDate: today,
      dueDate: addDays(today, Math.max(0, Math.round((span * (index + 1)) / steps.length))),
      memo: job ? jobMarker(job.id) : "office-v4",
    })),
  });

  if (job) await addLog(job.id, `${businessLine} 할일 ${steps.length}건을 만들었습니다. 마감 ${due}.`);
  return { created: steps.length, already: false };
}
