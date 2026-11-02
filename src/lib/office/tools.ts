import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { blockedReason, isToolName, limits } from "@/lib/office/policy";
import { addUsage, listJobs, listMemories, listPolicies, listSteps } from "@/lib/office/db";
import { completeJson } from "@/lib/office/llm";
import type { Job, Memory, PlanStep, Policy, ToolOutput } from "@/lib/office/types";

function clip(text: string, max = 240) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function related(goal: string, items: Memory[]) {
  const tokens = goal
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2);
  return items.filter((item) => {
    const hay = `${item.title} ${item.content}`.toLowerCase();
    return tokens.some((token) => hay.includes(token)) || hay.includes(goal.slice(0, 12).toLowerCase());
  });
}

export async function searchMemoryTool(query: string): Promise<ToolOutput> {
  const all = await listMemories("");
  const matched = related(query, all);
  const memories = (matched.length ? matched : all.filter((item) => item.kind === "rule")).slice(0, 8);
  const lines = memories.map((item) => `- [${item.kind}] ${item.title}: ${clip(item.content, 180)}`);
  const knowledge = knowledgeHits(query);
  const markdown = [...lines, ...knowledge].join("\n");
  return {
    ok: true,
    summary: memories.length || knowledge.length ? `기억 ${memories.length}건, 기업 지식 ${knowledge.length}건을 찾았습니다.` : "관련 기억이 없습니다.",
    markdown,
  };
}

function knowledgeHits(query: string) {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2);
  if (!tokens.length) return [];
  const directory = path.join(process.cwd(), "knowledge");
  let files: string[] = [];
  try {
    files = readdirSync(directory).filter((name) => name.endsWith(".md"));
  } catch {
    return [];
  }
  const hits: string[] = [];
  for (const name of files) {
    const text = readFileSync(path.join(directory, name), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const clean = line.replace(/^[-#*\s]+/, "").trim();
      if (clean.length < 8) continue;
      const hay = clean.toLowerCase();
      if (!tokens.some((token) => hay.includes(token))) continue;
      hits.push(`- [지식:${name}] ${clip(clean, 180)}`);
      if (hits.length >= 8) return hits;
    }
  }
  return hits;
}

export async function queryRunsTool(query: string): Promise<ToolOutput> {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2);
  const jobs = await listJobs(20);
  const related = (job: { goal: string }) => tokens.some((token) => job.goal.toLowerCase().includes(token));
  const shown = [...jobs.filter(related), ...jobs.filter((job) => !related(job))].slice(0, 8);
  const markdown = shown
    .map((job) => `- ${job.status}${job.paused ? " (일시중지)" : ""} · ${clip(job.goal, 80)} · ${job.createdAt.slice(0, 16)}`)
    .join("\n");
  return {
    ok: true,
    summary: `최근 작업 ${shown.length}건을 조회했습니다.`,
    markdown,
  };
}

export async function savePlanTool(job: Job, policies: Policy[]): Promise<ToolOutput> {
  const steps = await listSteps(job.id);
  const memoryHit = steps.find((step) => step.tool === "search_memory")?.output?.markdown || "검색 결과 없음";
  const history = steps.find((step) => step.tool === "query_runs")?.output?.markdown || "이전 실행 없음";
  const blocked = blockedReason(job.goal);
  const markdown = [
    `# 실행 계획`,
    ``,
    `목표: ${job.goal}`,
    ``,
    blocked ? `안전 제한: ${blocked}은 실행하지 않고 초안과 기록만 남깁니다.` : `안전 제한: 발송, 결제, 계약, 운영 반영은 하지 않습니다.`,
    ``,
    `## 참고한 기억`,
    memoryHit || "없음",
    ``,
    `## 과거 실행`,
    history || "없음",
    ``,
    `## 적용 중인 개선`,
    policies.length ? policies.map((policy) => `- ${policy.content}`).join("\n") : "없음",
    ``,
    `## 이번 실행`,
    `1. 기억과 과거 실행을 확인한다.`,
    `2. 내부 업무 문서 초안을 작성한다.`,
    `3. 결과를 평가하고, 반복할 문제가 있으면 대표 승인 전 개선안으로 올린다.`,
  ].join("\n");
  return { ok: true, summary: "업무 계획을 저장했습니다.", markdown };
}

export async function draftDocumentTool(job: Job, policies: Policy[]): Promise<ToolOutput> {
  const cap = limits();
  const freshRemaining = cap.maxCostUsd - job.costUsd;
  const blocked = blockedReason(job.goal);
  const memories = related(job.goal, await listMemories(job.goal)).slice(0, 5);
  const rules = [...policies.map((policy) => policy.content), ...memories.filter((item) => item.kind === "rule" || item.kind === "failure").map((item) => item.content)];

  const local = localDraft(job.goal, rules, blocked);
  if (freshRemaining < 0.01 || !process.env.OPENAI_API_KEY) {
    await addUsage({ jobId: job.id, model: "local-planner", tokensIn: 0, tokensOut: 0, costUsd: 0 });
    return { ok: true, summary: "업무 문서 초안을 저장했습니다. 외부로 보내지 않았습니다.", markdown: local };
  }

  try {
    const result = await completeJson({
      jobId: job.id,
      remainingUsd: freshRemaining,
      system:
        "당신은 엠지미디어 내부 업무 초안 작성자다. JSON {\"markdown\":\"...\"} 만 반환한다. 이메일 발송, 결제, 계약 변경, 운영 코드 수정, 서버 배포를 수행했다고 쓰지 않는다. 금액은 예상 범위이며 상담 후 확정이라고 적는다.",
      user: `목표:\n${job.goal}\n\n반드시 반영할 규칙:\n${rules.join("\n")}\n\n아래 뼈대를 바탕으로 한국어 초안을 작성:\n${local}`,
    });
    if (!result || result.skipped) return { ok: true, summary: "비용 한도로 기본 초안을 저장했습니다.", markdown: local };
    const markdown = typeof (result.json as { markdown?: unknown }).markdown === "string" ? (result.json as { markdown: string }).markdown : local;
    return { ok: true, summary: "언어 모델로 업무 문서 초안을 저장했습니다. 외부로 보내지 않았습니다.", markdown };
  } catch {
    return { ok: true, summary: "모델 응답을 쓰지 못해 기본 초안을 저장했습니다.", markdown: local };
  }
}

function localDraft(goal: string, rules: string[], blocked: string | null) {
  const kind = /견적|금액|가격/.test(goal) ? "견적 메모" : /제안|기획/.test(goal) ? "제안 초안" : /강의|교육/.test(goal) ? "강의 준비 메모" : "업무 메모";
  return [
    `# 엠지미디어 ${kind}`,
    ``,
    `이 문서는 내부 초안입니다. 고객 발송, 결제, 계약 변경, 운영 반영을 하지 않았습니다.`,
    blocked ? `요청에 포함된 '${blocked}'은 실행하지 않았습니다.` : ``,
    ``,
    `## 목표`,
    goal,
    ``,
    `## 진행안`,
    `1. 요청 범위를 상담 전 확인 항목과 바로 준비할 항목으로 나눈다.`,
    `2. 고객에게 보여줄 문안은 대표 확인 뒤에만 사용한다.`,
    `3. 일정과 담당을 한 줄로 정해 다음 실행의 규칙으로 남긴다.`,
    ``,
    `## 주의`,
    rules.length ? rules.map((rule) => `- ${rule}`).join("\n") : "- 등록된 추가 규칙이 없습니다.",
    ``,
    `## 금액`,
    `금액이 필요하면 기존 단가의 예상 범위로만 적고, 상담 후 확정이라고 함께 적습니다. 월 수량이 확인되지 않으면 발행 수량을 만들지 않습니다.`,
    ``,
    `## 대표 확인`,
    `- 외부에 전달해도 되는 문장인지`,
    `- 범위에서 빼야 할 약속이 있는지`,
    `- 다음 실행에 규칙으로 남길 문장이 있는지`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function evaluateTool(job: Job): Promise<{ output: ToolOutput; problem: string | null; proposal: string | null }> {
  const steps = await listSteps(job.id);
  const failed = steps.find((step) => step.status === "failed");
  const draft = [...steps].reverse().find((step) => step.tool === "draft_document" && step.output?.markdown);
  const failures = related(
    job.goal,
    (await listMemories("")).filter((item) => item.kind === "failure"),
  );
  const policies = await listPolicies();
  const uncovered = failures.find((item) => !policies.some((policy) => policy.content.includes(item.title) || item.content.slice(0, 24) && policy.content.includes(item.content.slice(0, 24))));

  if (failed) {
    return {
      output: { ok: false, summary: "실행 단계가 실패했습니다." },
      problem: failed.log || failed.output?.summary || "단계 실패",
      proposal: `다음 실행 전 '${failed.title}' 단계의 입력값을 확인하고, 같은 오류가 나면 초안 작성을 중단한 뒤 대표에게 원인만 보고한다.`,
    };
  }
  if (!draft) {
    return {
      output: { ok: false, summary: "문서 초안이 없습니다." },
      problem: "업무 문서 초안이 저장되지 않았습니다.",
      proposal: "계획에 문서 초안 단계를 항상 포함하고, 초안이 없으면 완료로 처리하지 않는다.",
    };
  }
  if (uncovered) {
    return {
      output: { ok: true, summary: "초안은 저장됐지만 과거 실패와 겹칩니다. 개선안을 올립니다." },
      problem: `과거 실패와 비슷한 목표입니다. ${uncovered.title}`,
      proposal: `다음 실행의 문서 초안은 이 실패를 먼저 반영합니다. ${uncovered.content}`,
    };
  }
  return {
    output: { ok: true, summary: "결과를 통과로 평가했습니다. 새 개선안은 없습니다." },
    problem: null,
    proposal: null,
  };
}

export function validateProposal(proposal: string) {
  const reason = blockedReason(proposal);
  if (reason) return { ok: false, text: `검증 실패: 개선안이 ${reason}을 지시합니다. 적용하지 않습니다.` };
  if (proposal.trim().length < 20) return { ok: false, text: "검증 실패: 개선안이 너무 짧습니다." };
  const dry = localPlanSteps("개선안 검증용 목표");
  const unknown = dry.filter((step) => !isToolName(step.tool));
  if (unknown.length) return { ok: false, text: "검증 실패: 허용되지 않은 도구가 계획에 포함됩니다." };
  return {
    ok: true,
    text: `검증 통과. 시험 계획은 ${dry.map((step) => step.tool).join(" → ")} 만 사용합니다. 외부 발송과 운영 변경은 포함되지 않습니다.`,
  };
}

export function localPlanSteps(goal: string): PlanStep[] {
  return [
    { title: "업무 규칙과 기억 검색", tool: "search_memory", input: { query: goal } },
    { title: "현재 작업과 과거 실행 조회", tool: "query_runs", input: { query: goal } },
    { title: "업무 계획 저장", tool: "save_plan", input: { goal } },
    { title: "업무 문서 초안 작성", tool: "draft_document", input: { goal } },
  ];
}

export async function createPlan(job: Job) {
  const cap = limits();
  const policies = await listPolicies();
  const policyText = policies.map((policy) => `- ${policy.content}`).join("\n") || "없음";
  const blocked = blockedReason(job.goal);
  const fallbackAnalysis = [
    `목표를 내부 문서와 계획 작업으로 이해했습니다.`,
    blocked ? `${blocked}은 실행하지 않습니다.` : `외부 발송, 결제, 계약, 운영 변경은 범위 밖입니다.`,
    policies.length ? `승인된 개선 ${policies.length}건을 이번 계획에 반영합니다.` : `아직 승인된 개선 규칙은 없습니다.`,
  ].join(" ");

  if (!process.env.OPENAI_API_KEY) {
    await addUsage({ jobId: job.id, model: "local-planner", tokensIn: 0, tokensOut: 0, costUsd: 0 });
    return { analysis: fallbackAnalysis, steps: localPlanSteps(job.goal).slice(0, Math.max(1, cap.maxSteps - 3)) };
  }

  const result = await completeJson({
    jobId: job.id,
    remainingUsd: cap.maxCostUsd,
    system: `당신은 엠지미디어 PM이다. JSON {"analysis":"","steps":[{"title":"","tool":"","input":{}}]} 만 반환한다. tool은 search_memory, query_runs, save_plan, draft_document 중 하나만 쓴다. 여섯 사업은 온라인마케팅, 영상, 개발, 렌탈, 교육, 디자인이다. 사업마다 다른 단계를 쓴다. 이메일 발송, 결제, 계약 확정, 입금 완료 처리, 운영 코드, 서버 작업은 계획에 넣지 않는다. 월 수량이나 입금 기록이 없으면 확인 필요라고 쓴다. 문미영에게 신규 고객을 배정하지 않는다. 단계는 최대 ${Math.max(1, cap.maxSteps - 3)}개다.`,
    user: `목표:\n${job.goal}\n\n적용 중인 개선:\n${policyText}`,
  });

  if (!result || result.skipped) {
    return { analysis: fallbackAnalysis, steps: localPlanSteps(job.goal) };
  }
  const body = result.json as { analysis?: unknown; steps?: unknown };
  const analysis = typeof body.analysis === "string" ? body.analysis : fallbackAnalysis;
  const steps = Array.isArray(body.steps) ? sanitizeSteps(body.steps).slice(0, Math.max(1, cap.maxSteps - 3)) : [];
  return { analysis, steps: steps.length ? steps : localPlanSteps(job.goal) };
}

function sanitizeSteps(value: unknown[]) {
  const steps: PlanStep[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { title?: unknown; tool?: unknown; input?: unknown };
    if (typeof row.tool !== "string" || !isToolName(row.tool)) continue;
    if (!["search_memory", "query_runs", "save_plan", "draft_document"].includes(row.tool)) continue;
    steps.push({
      title: typeof row.title === "string" && row.title.trim() ? row.title.trim() : row.tool,
      tool: row.tool,
      input: row.input && typeof row.input === "object" ? (row.input as Record<string, unknown>) : {},
    });
  }
  return steps;
}
