import { prisma } from "@/lib/db";
import type { ToolOutput } from "@/lib/office/types";

function line(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export async function runReadTool(name: string, input: Record<string, unknown>): Promise<ToolOutput> {
  if (name === "list_tasks") {
    const videoGap = input.videoGap === true;
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        ...(videoGap
          ? { OR: [{ title: { contains: "영상" } }, { title: { contains: "편집" } }, { title: { contains: "촬영" } }] }
          : {}),
      },
      select: { id: true, title: true, status: true, dueDate: true, assignee: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 20,
    });
    const rows = tasks.filter((task) => !videoGap || !task.assignee);
    const markdown = rows.length
      ? rows.map((task) => `- ${task.title} · ${task.status} · 담당 ${task.assignee?.name || "없음"} · ${task.dueDate || "마감 확인 필요"}`).join("\n")
      : "해당 조건의 할일이 없습니다. 확인 필요.";
    return { ok: true, summary: `할일 ${rows.length}건을 조회했습니다.`, markdown };
  }
  if (name === "get_task") {
    const id = typeof input.id === "string" ? input.id : "";
    if (!id) return { ok: false, summary: "할일 id가 없습니다." };
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, dueDate: true, assignee: { select: { name: true } } },
    });
    if (!task) return { ok: false, summary: "할일을 찾지 못했습니다." };
    return { ok: true, summary: task.title, markdown: `${task.title} · ${task.status} · 담당 ${task.assignee?.name || "없음"}` };
  }
  if (name === "list_leads") {
    const leads = await prisma.lead.findMany({
      where: { stage: { notIn: ["WON", "LOST"] } },
      select: { title: true, stage: true, nextContactDate: true, customer: { select: { companyName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const markdown = leads.length
      ? leads.map((lead) => `- ${lead.customer.companyName} · ${lead.stage} · ${lead.nextContactDate || "상담일 확인 필요"}`).join("\n")
      : "열린 상담이 없습니다.";
    return { ok: true, summary: `상담 ${leads.length}건을 조회했습니다.`, markdown };
  }
  if (name === "list_projects" || name === "get_project") {
    const id = typeof input.id === "string" ? input.id : "";
    const projects = await prisma.project.findMany({
      where: id ? { id } : { status: { notIn: ["CLOSED"] } },
      select: { id: true, name: true, status: true, dueDate: true, customer: { select: { companyName: true } } },
      take: 20,
    });
    if (name === "get_project" && !projects.length) return { ok: false, summary: "프로젝트를 찾지 못했습니다." };
    const markdown = projects.length
      ? projects.map((project) => `- ${project.customer.companyName} · ${project.name} · ${project.status} · ${project.dueDate || "납기 확인 필요"}`).join("\n")
      : "진행 중 프로젝트가 없습니다. 확인 필요.";
    return { ok: true, summary: `프로젝트 ${projects.length}건을 조회했습니다.`, markdown };
  }
  if (name === "list_receivables") {
    const payments = await prisma.payment.findMany({
      where: { status: { in: ["PLANNED", "OVERDUE"] } },
      select: { label: true, amount: true, dueDate: true, status: true, project: { select: { customer: { select: { companyName: true } } } } },
      take: 20,
    });
    const markdown = payments.length
      ? payments
          .map((payment) => {
            const state = payment.status === "OVERDUE" ? "지급 지연 후보" : "청구 후보";
            const company = payment.project?.customer.companyName || "고객명 확인 필요";
            return `- ${state} · ${company} · ${payment.label} · ${payment.amount.toLocaleString("ko-KR")}원 · ${payment.dueDate || "지급일 확인 필요"}`;
          })
          .join("\n")
      : "청구 후보가 없습니다. 입금 완료로 단정하지 않습니다.";
    return { ok: true, summary: `수금 후보 ${payments.length}건입니다. 입금 완료로 바꾸지 않았습니다.`, markdown };
  }
  if (name === "list_employees") {
    const staff = await prisma.staff.findMany({
      where: { active: true },
      select: { name: true, role: true },
      orderBy: { name: "asc" },
      take: 30,
    });
    const markdown = staff.length ? staff.map((person) => `- ${person.name} · ${person.role}`).join("\n") : "재직 직원이 확인되지 않습니다.";
    return { ok: true, summary: `직원 ${staff.length}명을 조회했습니다. 담당 고객 수는 확인 필요.`, markdown };
  }
  return { ok: false, summary: line(`${name}은 조회 도구가 아닙니다.`) };
}
