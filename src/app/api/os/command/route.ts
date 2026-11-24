import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type TaskPlan = {
  taskId: string;
  projectId: string;
  staffId: string;
  title: string;
  dueDate: string;
};

const audience = "mzmedia-os-task-confirmation";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const finishedProjects = ["CLOSED", "DELIVERED"] as const;

function answer(text: string, extra = {}) {
  return NextResponse.json({ text, ...extra }, { headers: { "Cache-Control": "no-store" } });
}

function tokenKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw Error("Task signing unavailable");
  return new TextEncoder().encode(secret);
}

function dateKey() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", dateStyle: "short" }).format(new Date());
}

function dateValid(date: string) {
  if (!datePattern.test(date)) return false;
  const parsed = new Date(date + "T00:00:00Z");
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
}

async function deadlines(prompt: string) {
  const today = dateKey();
  const includeLate = /지연|밀린|지난|기한.*초과/.test(prompt);
  const includeToday = /오늘|당일/.test(prompt) || !includeLate;
  const dueDate = includeToday && includeLate ? { gt: "", lte: today } :
    includeLate ? { gt: "", lt: today } : { equals: today };
  const projectWhere = { status: { notIn: [...finishedProjects] }, dueDate };
  const taskWhere = { status: { not: "DONE" as const }, dueDate };
  const [projects, tasks, projectCount, taskCount] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere, orderBy: { dueDate: "asc" }, take: 12,
      select: { id: true, name: true, dueDate: true },
    }),
    prisma.task.findMany({
      where: taskWhere, orderBy: { dueDate: "asc" }, take: 12,
      select: { id: true, title: true, dueDate: true, projectId: true, assignee: { select: { name: true } } },
    }),
    prisma.project.count({ where: projectWhere }),
    prisma.task.count({ where: taskWhere }),
  ]);
  const label = includeToday && includeLate ? "오늘 납기 및 지연" : includeLate ? "지연" : "오늘 납기";
  const items = [
    ...projects.map(p => ({ text: (p.dueDate < today ? "지연 · " : "오늘 · ") + p.dueDate + " · 프로젝트 · " + p.name, href: "/os/projects/" + p.id })),
    ...tasks.map(t => ({ text: (t.dueDate < today ? "지연 · " : "오늘 · ") + t.dueDate + " · 할 일 · " + t.title + " · " + (t.assignee?.name || "미배정"), href: t.projectId ? "/os/projects/" + t.projectId : "/os/tasks" })),
  ];
  return answer(today + " 한국시간 기준 " + label + " · 프로젝트 " + projectCount + "건, 할 일 " + taskCount + "건." +
    (items.length < projectCount + taskCount ? " 각 유형에서 최대 12건을 표시합니다." : ""), { items });
}

async function parseTask(prompt: string) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw Error("Model unavailable");
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 250,
      store: false,
      messages: [
        { role: "system", content: "한국어 ERP 명령을 분류하라. 프로젝트 할 일 등록 요청만 허용한다. 정확히 JSON으로 action(create 또는 unsupported), project(명시된 프로젝트 검색어), assignee(명시된 직원 이름 또는 아이디), title(요청한 할 일 제목), dueDate(YYYY-MM-DD 또는 빈 문자열)를 반환하라. 없는 정보는 빈 문자열로 둔다. 프로젝트나 담당자 이름을 추정하지 마라. 날짜 계산 기준은 한국시간 " + dateKey() + "이다. 견적, 계약, 수금, 발송, 수정, 삭제 또는 복수 변경 요청은 unsupported다." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw Error("Model HTTP " + response.status);
  const payload = await response.json();
  return JSON.parse(payload.choices?.[0]?.message?.content ?? "{}") as Record<string, unknown>;
}

function field(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length <= max ? value.trim() : "";
}

async function prepareTask(prompt: string, staffId: string) {
  const parsed = await parseTask(prompt);
  if (parsed.action !== "create") return answer("현재는 오늘 납기·지연 조회와 프로젝트 할 일 한 건 등록을 처리합니다.");
  const project = field(parsed.project, 100);
  const name = field(parsed.assignee, 100);
  const title = field(parsed.title, 150);
  const dueDate = field(parsed.dueDate, 10);
  if (!project || !name || !title) {
    return answer("프로젝트명, 담당 직원 이름 또는 아이디, 할 일 이름을 알려주세요.", { followUp: true });
  }
  if (dueDate && !dateValid(dueDate)) return answer("기한을 YYYY-MM-DD 형식으로 알려주세요.", { followUp: true });
  const [projects, staff] = await Promise.all([
    prisma.project.findMany({
      where: { name: { contains: project, mode: "insensitive" }, status: { notIn: [...finishedProjects] } },
      select: { id: true, name: true }, orderBy: { name: "asc" }, take: 8,
    }),
    prisma.staff.findMany({
      where: { active: true, OR: [{ name: { equals: name, mode: "insensitive" } }, { username: { equals: name, mode: "insensitive" } }] },
      select: { id: true, name: true }, take: 2,
    }),
  ]);
  const exact = projects.filter(p => p.name.toLowerCase() === project.toLowerCase());
  const candidates = exact.length ? exact : projects;
  if (candidates.length !== 1 || staff.length !== 1) {
    const error = candidates.length !== 1 ? "프로젝트를 하나로 특정할 수 없습니다. 정확한 프로젝트명을 알려주세요." :
      "활성 담당자를 하나로 특정할 수 없습니다. 정확한 직원 아이디를 알려주세요.";
    return answer(error, { followUp: true, items: candidates.map(p => ({ text: p.name, href: "/os/projects/" + p.id })) });
  }

  const plan: TaskPlan = { taskId: randomUUID(), projectId: candidates[0].id, staffId: staff[0].id, title, dueDate };
  const confirmation = await new SignJWT({ plan }).setProtectedHeader({ alg: "HS256" })
    .setAudience(audience).setSubject(staffId).setExpirationTime("10m").sign(tokenKey());
  return answer("등록 내용을 확인해 주세요.", {
    confirmation, preview: { title, project: candidates[0].name, assignee: staff[0].name, dueDate },
  });
}

async function createConfirmedTask(confirmation: string, staffId: string) {
  let plan: TaskPlan;
  try {
    const { payload } = await jwtVerify(confirmation, tokenKey(), {
      audience, subject: staffId, algorithms: ["HS256"],
    });
    plan = payload.plan as TaskPlan;
  } catch {
    return answer("확인 시간이 지났습니다. 명령을 다시 입력해 주세요.");
  }
  const [project, assigned] = await Promise.all([
    prisma.project.findFirst({ where: { id: plan.projectId, status: { notIn: [...finishedProjects] } }, select: { id: true } }),
    prisma.staff.findFirst({ where: { id: plan.staffId, active: true }, select: { id: true } }),
  ]);
  if (!project || !assigned) return answer("프로젝트 또는 담당자 상태가 바뀌었습니다. 명령을 다시 입력해 주세요.");
  const task = await prisma.task.upsert({
    where: { id: plan.taskId }, update: {},
    create: { id: plan.taskId, title: plan.title, projectId: project.id, assigneeId: assigned.id, createdById: staffId, dueDate: plan.dueDate },
    select: { id: true, title: true, projectId: true },
  });
  return answer("ERP에 할 일을 등록했습니다.", {
    items: [{ text: task.title + " · 작업 ID " + task.id, href: "/os/projects/" + task.projectId }],
  });
}

export async function POST(request: Request) {
  const staff = await getSessionStaff();
  if (!staff) return NextResponse.json({ text: "로그인이 필요합니다." }, { status: 401 });
  if (staff.role !== "SUPER_ADMIN") return NextResponse.json({ text: "대표 계정만 사용할 수 있습니다." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body) return answer("명령을 입력해 주세요.");
  try {
    const confirmation = field(body.confirmation, 3000);
    if (confirmation) return await createConfirmedTask(confirmation, staff.id);
    const prompt = field(body.prompt, 1000);
    if (!prompt) return answer("명령을 1~1,000자로 입력해 주세요.");
    if (/(납기|마감|기한|지연|밀린)/.test(prompt) && /알려|보여|조회|현황|정리|확인/.test(prompt) &&
        !/추가|등록|만들|수정|삭제|변경|완료해|발송/.test(prompt)) {
      return await deadlines(prompt);
    }
    return await prepareTask(prompt, staff.id);
  } catch (error) {
    console.error("ERP command failed", error instanceof Error ? error.name : "Unknown");
    return NextResponse.json({ text: "명령을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
