import { prisma } from "@/lib/db";
import {
  acceptModelAgent,
  activationDecision,
  agentKeyFor,
  canDelegate,
  classifyTurn,
  filterTools,
  forbiddenParts,
  specialistMayCall,
  type ServerTool,
} from "@/lib/office/agent-policy";
import { createJob, updateJob } from "@/lib/office/db";
import { completeJson } from "@/lib/office/llm";
import { AGENT_CAP, ORG, orgByKey } from "@/lib/office/org";
import { renderDeliveryPackage } from "@/lib/office/package";
import { llmEnabled, limits } from "@/lib/office/policy";
import { runReadTool } from "@/lib/office/read-tools";
import { searchMemoryTool } from "@/lib/office/tools";
import { workBoard } from "@/lib/office/work";

type AgentRow = {
  id: string;
  agentKey: string;
  name: string;
  description: string;
  businessDomain: string;
  systemInstructions: string;
  allowedTools: string;
  version: number;
  status: string;
  deferredNote: string;
  testResult: string;
  decisionLog: string;
};

function toolsOf(row: { allowedTools: string }): ServerTool[] {
  return filterTools(JSON.parse(row.allowedTools) as unknown).allowed;
}

async function finish(id: string, status: "COMPLETED" | "WAITING_APPROVAL" | "FAILED", report: string) {
  await updateJob(id, { status, report, finishedAt: status === "WAITING_APPROVAL" ? null : new Date().toISOString(), error: status === "FAILED" ? report : "" });
  return { jobId: id, status, report, llm: llmEnabled() };
}

async function activeAgent(agentKey: string) {
  return prisma.officeAgent.findFirst({ where: { agentKey, status: "ACTIVE" }, orderBy: { version: "desc" } });
}

export async function officeTurn(message: string) {
  const text = message.trim();
  if (text.length < 2) throw new Error("질문을 적어 주세요.");
  const turn = classifyTurn(text);
  const forbidden = forbiddenParts(text);
  const id = await createJob(text);
  await updateJob(id, { status: "RUNNING", analysis: turn.kind, startedAt: new Date().toISOString() });

  if (turn.kind === "blocked_work") {
    const board = await workBoard();
    const lines = board.exceptions.slice(0, 8).map((item) => `- ${item.reason} ${item.title}`);
    const report = lines.length
      ? `기존 PM이 막힌 제작 ${board.exceptions.length}건을 조회했습니다. 새 에이전트는 만들지 않았습니다.\n${lines.join("\n")}`
      : "기존 PM이 할일을 조회했습니다. 막힌 제작은 없습니다. 새 에이전트는 만들지 않았습니다.";
    return finish(id, "COMPLETED", report);
  }

  if (turn.kind === "create") return createSpecialist(id, text, turn.domain, turn.forceActivate);
  if (turn.kind === "delegate") return delegateSpecialist(id, text, turn.domain);

  if (forbidden.length) {
    const draft = /견적|초안/.test(text) ? "견적 초안은 이 대화 안에 남길 수 있습니다. 고객에게는 보내지 않았습니다." : "";
    return finish(id, "COMPLETED", `${forbidden.join(", ")}은 실행하지 않습니다. ${draft}`.trim());
  }

  const routed = await routeOrgWork(text);
  if (routed) return finish(id, "COMPLETED", routed);

  const memory = await searchMemoryTool(text);
  if (!llmEnabled()) {
    return finish(id, "COMPLETED", `언어 모델이 연결되지 않아 기업 지식 검색만 사용했습니다. AI가 새로 쓴 답변으로 보이지 않습니다.\n${memory.markdown || "관련 지식이 없습니다."}`);
  }
  const result = await completeJson({
    jobId: id,
    remainingUsd: limits().maxCostUsd,
    system: "엠지미디어 PM이다. JSON {\"markdown\":\"\"} 만 반환한다. 없는 수치는 확인 필요라고 쓴다. 발송, 결제, 계약 체결을 했다고 쓰지 않는다.",
    user: `${text}\n\n지식:\n${memory.markdown || "없음"}`,
  });
  const markdown = result && !result.skipped && typeof (result.json as { markdown?: unknown }).markdown === "string" ? (result.json as { markdown: string }).markdown : memory.markdown || "확인 필요";
  return finish(id, "COMPLETED", markdown);
}

async function routeOrgWork(message: string) {
  if (/견적|제안서/.test(message)) {
    const draft = renderDeliveryPackage({ request: message }, []);
    return `수주 담당이 초안을 만들었습니다. 대표 메일함으로 보내지 않았고, 고객에게도 보내지 않았습니다.\n\n${draft}`;
  }
  if (/계약서/.test(message)) {
    return [
      "수주 담당이 계약서 초안만 적습니다. 서명과 조건 확정은 하지 않았습니다.",
      "당사자: 엠지미디어와 고객. 고객명은 상담 기록으로 확인합니다.",
      "범위: 대표가 승인한 견적 항목만. 승인 전이면 확인 필요.",
      "금액: 상담 후 확정. 할인율은 적지 않습니다.",
      "납품과 수정: 사업별 절차를 따르고, 발행과 배포는 이 초안에 넣지 않습니다.",
      "홈스파월드, 하을·더이음은 계약 전이므로 이 초안의 계약 상대가 아닙니다.",
    ].join("\n");
  }
  if (/발행|게시|포스팅/.test(message)) {
    return [
      "바이럴 담당이 발행 묶음 초안을 만들었습니다. 게시하지 않았습니다.",
      "채널: 확인 필요",
      "문안: 대표가 이 대화에 적은 요청을 초안으로 둡니다.",
      "이미지 지시: 확인 필요",
      "발행 시각: 확인 필요",
      "올리는 사람은 문미영입니다. 이 초안을 발행 완료로 세지 않습니다.",
    ].join("\n");
  }
  if (/일정/.test(message)) {
    return [
      "엠지몬이 일정 초안만 적습니다. 승인된 범위 전에는 할 일을 만들지 않습니다.",
      "문미영에게 새 고객을 배정하지 않습니다. 현재 담당 수는 확인 전이고 상한은 4곳입니다.",
      "1. 수주: 승인된 범위만 확정",
      "2. 해당 사업 담당: 작업 분해와 날짜",
      "3. 바이럴이면 문안과 시각까지. 발행은 사람이 합니다.",
      "4. 편집 담당이 없는 영상은 대표 예외로 남깁니다.",
    ].join("\n");
  }
  if (/수금|미수|청구/.test(message)) {
    const output = await runReadTool("list_receivables", {});
    return `수금 담당이 후보만 조회했습니다. 입금 완료로 바꾸지 않았고 독촉을 보내지 않았습니다. 2026-11 예상 수금 약 1,700만원은 예상치이며 현금 잔액이 아닙니다.\n${output.summary}\n${output.markdown || ""}`;
  }
  return "";
}

async function createSpecialist(jobId: string, message: string, domain: string, forceActivate: boolean) {
  const agentKey = agentKeyFor(domain);
  const seated = orgByKey(agentKey);
  if (seated?.mode === "SEAT") {
    return finish(jobId, "COMPLETED", `${seated.name} 담당은 자리만 있습니다. ${seated.phase} 전에는 켜지 않습니다.`);
  }
  const openCount = await prisma.officeAgent.count({ where: { status: { not: "ARCHIVED" } } });
  if (openCount >= AGENT_CAP) {
    return finish(jobId, "COMPLETED", `담당은 ${AGENT_CAP}개까지입니다. 새 담당을 만들지 않았습니다. 겹치는 담당을 끄거나 합친 뒤에 다시 말합니다.`);
  }
  const existing = await activeAgent(agentKey);
  if (existing) {
    return finish(jobId, "COMPLETED", `이미 활성화된 ${existing.name} ${existing.version}판이 있습니다. 같은 에이전트를 다시 만들지 않았습니다.`);
  }
  if (!llmEnabled()) {
    const refusal = forceActivate ? " 승인 없이 활성화하지도 않습니다." : "";
    return finish(jobId, "COMPLETED", `OPENAI_API_KEY가 없어 새 전문 에이전트를 AI로 생성하지 않습니다. 고정 문장을 실제 AI 결과처럼 저장하지 않았습니다.${refusal}`);
  }
  let parsed: unknown;
  try {
    const result = await completeJson({
      jobId,
      remainingUsd: limits().maxCostUsd,
      system: `JSON만 반환한다. 키는 name, description, businessDomain, systemInstructions, allowedTools, inputSchema, outputSchema, evaluationCriteria, unsupportedTools. allowedTools는 다음 중만 쓴다: ${filterTools(["list_tasks", "get_task", "list_projects", "get_project", "list_receivables", "list_employees", "search_memory", "draft_document", "evaluate_result"]).allowed.join(", ")}. 발송, 결제, 계약, 배포 도구는 넣지 않는다.`,
      user: message,
    });
    if (!result) return finish(jobId, "FAILED", "언어 모델이 응답하지 않았습니다. 에이전트를 활성화하지 않았습니다.");
    if (result.skipped) return finish(jobId, "FAILED", result.reason);
    parsed = result.json;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "언어 모델 호출에 실패했습니다.";
    return finish(jobId, "FAILED", `${reason} 에이전트를 활성화하지 않았습니다.`);
  }
  const accepted = acceptModelAgent(parsed, domain);
  if (!accepted.ok) return finish(jobId, "FAILED", accepted.error);
  const previous = await prisma.officeAgent.findFirst({ where: { agentKey: accepted.agent.agentKey }, orderBy: { version: "desc" } });
  const version = (previous?.version ?? 0) + 1;
  const deny = canDelegate({ callerIsSpecialist: false, stepsUsed: 1, maxSteps: limits().maxSteps });
  if (deny) return finish(jobId, "FAILED", deny);
  const testTool = accepted.agent.allowedTools.find((tool) => tool === "list_tasks" || tool === "search_memory") || accepted.agent.allowedTools[0];
  const testDeny = specialistMayCall(accepted.agent.allowedTools, testTool);
  const test = testDeny
    ? { ok: false, summary: testDeny, markdown: "" }
    : testTool === "search_memory"
      ? await searchMemoryTool(message)
      : await runReadTool(testTool, { videoGap: domain === "VIDEO_PRODUCTION" });
  const row = await prisma.officeAgent.create({
    data: {
      agentKey: accepted.agent.agentKey,
      name: accepted.agent.name,
      description: accepted.agent.description,
      businessDomain: accepted.agent.businessDomain,
      systemInstructions: accepted.agent.systemInstructions,
      allowedTools: JSON.stringify(accepted.agent.allowedTools),
      inputSchema: accepted.agent.inputSchema,
      outputSchema: accepted.agent.outputSchema,
      evaluationCriteria: accepted.agent.evaluationCriteria,
      deferredNote: accepted.agent.deferredNote,
      version,
      status: "PENDING_APPROVAL",
      testResult: `${test.summary}\n${test.markdown || ""}`.trim(),
      decisionLog: forceActivate ? "대표가 승인 없이 사용을 요청했으나 활성화하지 않았습니다." : "",
    },
  });
  const report = [
    `${row.name} ${version}판을 승인 대기로 등록했습니다. 아직 활성화하지 않았습니다.`,
    `도구: ${accepted.agent.allowedTools.join(", ")}`,
    accepted.agent.deferredNote,
    `테스트: ${row.testResult}`,
    forceActivate ? "승인 없이 바로 사용하라는 요청은 거부했습니다." : "대표 승인 후에만 일을 맡깁니다.",
  ]
    .filter(Boolean)
    .join("\n");
  return { ...(await finish(jobId, "WAITING_APPROVAL", report)), agentId: row.id };
}

async function delegateSpecialist(jobId: string, message: string, domain: string) {
  const gate = canDelegate({ callerIsSpecialist: false, stepsUsed: 0, maxSteps: limits().maxSteps });
  if (gate) return finish(jobId, "FAILED", gate);
  const agentKey = agentKeyFor(domain);
  const agent = await activeAgent(agentKey);
  if (!agent) {
    const pending = await prisma.officeAgent.findFirst({ where: { agentKey, status: "PENDING_APPROVAL" }, orderBy: { version: "desc" } });
    const report = pending
      ? `${pending.name}은 승인 전입니다. 활성화하지 않았고 일을 맡기지 않았습니다.`
      : "활성화된 전문 에이전트가 없습니다. 승인 전에는 일을 맡기지 않습니다.";
    return finish(jobId, "COMPLETED", report);
  }
  const allowed = toolsOf(agent);
  const calls: { tool: string; summary: string; markdown?: string }[] = [];
  const plan = ["list_tasks", "list_projects", "search_memory"] as const;
  for (const tool of plan) {
    if (calls.length >= limits().maxSteps - 1) {
      calls.push({ tool: "limit", summary: "단계 한도를 초과해 이후 호출을 중단합니다." });
      break;
    }
    const relevant = tool === "list_tasks" ? /할일|담당|영상|업무|막힌/.test(message) : tool === "list_projects" ? /프로젝트/.test(message) : /지식|정책|규칙/.test(message);
    if (!relevant) continue;
    const deny = specialistMayCall(allowed, tool);
    if (deny) continue;
    const output = tool === "search_memory" ? await searchMemoryTool(message) : await runReadTool(tool, { videoGap: /영상/.test(message) && /담당/.test(message) });
    calls.push({ tool, summary: output.summary, markdown: output.markdown });
  }
  if (!calls.length) {
    const output = allowed.includes("list_tasks") ? await runReadTool("list_tasks", {}) : { ok: false, summary: "허용된 조회 도구가 없습니다.", markdown: "" };
    calls.push({ tool: allowed.includes("list_tasks") ? "list_tasks" : "none", summary: output.summary, markdown: output.markdown });
  }
  const outputText = calls.map((call) => `## ${call.tool}\n${call.summary}\n${call.markdown || ""}`).join("\n");
  await prisma.officeDelegation.create({
    data: {
      parentJobId: jobId,
      agentId: agent.id,
      agentVersion: agent.version,
      assignedGoal: message,
      status: "COMPLETED",
      outputData: outputText,
      evaluationResult: "조회 결과만 반환했습니다. 없는 항목은 확인 필요이며, 발송과 계약은 하지 않았습니다.",
      toolCalls: JSON.stringify(calls.map((call) => call.tool)),
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  return finish(jobId, "COMPLETED", `${agent.name} ${agent.version}판에 맡겼습니다.\n${outputText}`);
}

export async function listOrg() {
  const keys = ORG.map((seat) => seat.agentKey);
  const rows = await prisma.officeAgent.findMany({ where: { agentKey: { in: keys } }, orderBy: { version: "desc" } });
  const openCount = await prisma.officeAgent.count({ where: { status: { not: "ARCHIVED" } } });
  return {
    cap: AGENT_CAP,
    openCount,
    seats: ORG.map((seat) => {
      const row = rows.find((item) => item.agentKey === seat.agentKey);
      return {
        ...seat,
        status: row?.status ?? (seat.mode === "ON" ? "ACTIVE" : "SEAT"),
        version: row?.version ?? 1,
        recordId: row?.id ?? seat.id,
      };
    }),
  };
}

export async function listPendingAgents() {
  const rows = await prisma.officeAgent.findMany({ where: { status: "PENDING_APPROVAL" }, orderBy: { createdAt: "desc" }, take: 10 });
  return rows.map(presentAgent);
}

export async function recentTurns() {
  const jobs = await prisma.officeJob.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, goal: true, report: true, status: true, createdAt: true } });
  return jobs.map((job) => ({ id: job.id, goal: job.goal, report: job.report, status: job.status, createdAt: job.createdAt.toISOString() }));
}

export async function decideAgent(id: string, decision: string, actor: string) {
  const agent = await prisma.officeAgent.findUnique({ where: { id } });
  if (!agent) throw new Error("에이전트를 찾지 못했습니다.");
  const result = activationDecision(agent.status, decision);
  if (!result.ok) throw new Error(result.reason);
  if (result.next === "ACTIVE") {
    await prisma.officeAgent.updateMany({
      where: { agentKey: agent.agentKey, status: "ACTIVE", NOT: { id } },
      data: { status: "DISABLED" },
    });
  }
  const stamp = new Date().toISOString();
  await prisma.officeAgent.update({
    where: { id },
    data: {
      status: result.next,
      approvedAt: result.next === "ACTIVE" ? new Date() : agent.approvedAt,
      approvedBy: result.next === "ACTIVE" ? actor : agent.approvedBy,
      decisionLog: `${agent.decisionLog}\n${stamp} ${actor} ${decision}`.trim(),
    },
  });
  return presentAgent({ ...agent, status: result.next });
}

function presentAgent(row: AgentRow) {
  return {
    id: row.id,
    agentKey: row.agentKey,
    name: row.name,
    version: row.version,
    status: row.status,
    businessDomain: row.businessDomain,
    description: row.description,
    allowedTools: toolsOf(row),
    deferredNote: row.deferredNote,
    testResult: row.testResult,
  };
}
