export const SERVER_TOOLS = [
  "query_runs",
  "save_plan",
  "draft_document",
  "search_memory",
  "evaluate_result",
  "propose_improvement",
  "request_approval",
  "list_tasks",
  "get_task",
  "list_leads",
  "list_projects",
  "get_project",
  "list_receivables",
  "list_employees",
] as const;

export type ServerTool = (typeof SERVER_TOOLS)[number];

const READ_TOOLS = new Set<ServerTool>([
  "list_tasks",
  "get_task",
  "list_leads",
  "list_projects",
  "get_project",
  "list_receivables",
  "list_employees",
  "query_runs",
  "search_memory",
]);

export function isServerTool(value: string): value is ServerTool {
  return (SERVER_TOOLS as readonly string[]).includes(value);
}

export function filterTools(requested: unknown) {
  const names = Array.isArray(requested) ? requested : [];
  const allowed: ServerTool[] = [];
  const deferred: string[] = [];
  for (const item of names) {
    if (typeof item !== "string") continue;
    const name = item.trim();
    if (!name || allowed.includes(name as ServerTool)) continue;
    if (isServerTool(name)) allowed.push(name);
    else deferred.push(name);
  }
  return { allowed, deferred };
}

export function domainOf(message: string) {
  if (/수금|미수|청구/.test(message)) return "COLLECTIONS";
  if (/견적|제안서|계약서/.test(message)) return "SALES";
  if (/영상|편집|촬영/.test(message)) return "VIDEO_PRODUCTION";
  if (/렌탈|노트북|장비/.test(message)) return "EQUIPMENT_RENTAL";
  if (/교육|강의|수강/.test(message)) return "EDUCATION_COURSE";
  if (/디자인|인쇄|책자/.test(message)) return "DESIGN_PRINT";
  if (/개발|홈페이지|앱/.test(message)) return "WEB_APP_DEVELOPMENT";
  if (/마케팅|바이럴|블로그|인스타/.test(message)) return "MARKETING_RETAINER";
  return "공통";
}

export function agentKeyFor(domain: string) {
  if (domain === "COLLECTIONS") return "collections-pm";
  if (domain === "SALES") return "sales-pm";
  if (domain === "VIDEO_PRODUCTION") return "video-pm";
  if (domain === "EQUIPMENT_RENTAL") return "rental-pm";
  if (domain === "EDUCATION_COURSE") return "education-pm";
  if (domain === "DESIGN_PRINT") return "design-pm";
  if (domain === "WEB_APP_DEVELOPMENT") return "dev-pm";
  if (domain === "MARKETING_RETAINER") return "marketing-pm";
  return "specialist-pm";
}

export type TurnKind = "create" | "delegate" | "blocked_work" | "question";

export function classifyTurn(message: string) {
  const forceActivate = /승인\s*없이/.test(message);
  const create = /에이전트/.test(message) && /만들/.test(message);
  const delegate = /에이전트/.test(message) && /찾아|맡겨|에게/.test(message) && !create;
  if (create) return { kind: "create" as TurnKind, forceActivate, domain: domainOf(message) };
  if (delegate) return { kind: "delegate" as TurnKind, forceActivate: false, domain: domainOf(message) };
  if (/막힌/.test(message)) return { kind: "blocked_work" as TurnKind, forceActivate: false, domain: "공통" };
  return { kind: "question" as TurnKind, forceActivate: false, domain: domainOf(message) };
}

export function forbiddenParts(message: string) {
  const found: string[] = [];
  if (/(이메일|메일|문자|메신저|고객).{0,16}(보내|발송)/.test(message) || /(보내|발송).{0,12}(이메일|메일|문자|견적)/.test(message)) found.push("고객 발송");
  if (/계약/.test(message) && /체결|변경|해지|갱신/.test(message)) found.push("계약 체결");
  if (/결제|환불|카드\s*승인|입금\s*완료|급여\s*이체|광고비\s*충전/.test(message)) found.push("결제 또는 입금 처리");
  if (/배포|운영\s*(코드|서버)/.test(message)) found.push("운영 변경");
  return found;
}

export function canDelegate(input: { callerIsSpecialist: boolean; stepsUsed: number; maxSteps: number }) {
  if (input.callerIsSpecialist) return "하위 에이전트는 다른 에이전트를 만들거나 부르지 못합니다.";
  if (input.stepsUsed >= input.maxSteps) return "단계 한도를 초과해 실행을 중단합니다.";
  return "";
}

export function activationDecision(status: string, decision: string) {
  if (decision === "approve") {
    if (status !== "PENDING_APPROVAL") return { ok: false, next: status, reason: "승인 대기 상태가 아니라 활성화하지 않습니다." };
    return { ok: true, next: "ACTIVE", reason: "" };
  }
  if (decision === "reject") {
    if (status === "ACTIVE") return { ok: false, next: status, reason: "이미 활성인 버전은 이 요청으로 지우지 않습니다." };
    return { ok: true, next: "ARCHIVED", reason: "" };
  }
  return { ok: false, next: status, reason: "승인 또는 거절만 할 수 있습니다." };
}

export type AgentDraft = {
  agentKey: string;
  name: string;
  description: string;
  businessDomain: string;
  systemInstructions: string;
  allowedTools: ServerTool[];
  inputSchema: string;
  outputSchema: string;
  evaluationCriteria: string;
  deferredNote: string;
};

export function acceptModelAgent(raw: unknown, fallbackDomain: string): { ok: true; agent: AgentDraft } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "모델 응답이 에이전트 정의가 아닙니다." };
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) return { ok: false, error: "에이전트 이름이 없습니다." };
  const domain = typeof body.businessDomain === "string" && body.businessDomain.trim() ? body.businessDomain.trim() : fallbackDomain;
  const tools = filterTools(body.allowedTools);
  const unsupported = [
    ...tools.deferred,
    ...(Array.isArray(body.unsupportedTools) ? body.unsupportedTools.filter((item) => typeof item === "string") : []),
  ];
  const usable = tools.allowed.filter((tool) => tool !== "request_approval");
  if (!usable.length) return { ok: false, error: "허용된 도구가 없습니다." };
  return {
    ok: true,
    agent: {
      agentKey: agentKeyFor(domain),
      name,
      description: typeof body.description === "string" ? body.description.trim() : "",
      businessDomain: domain,
      systemInstructions: typeof body.systemInstructions === "string" ? body.systemInstructions.trim() : "",
      allowedTools: usable,
      inputSchema: typeof body.inputSchema === "string" ? body.inputSchema : "{}",
      outputSchema: typeof body.outputSchema === "string" ? body.outputSchema : "{}",
      evaluationCriteria: typeof body.evaluationCriteria === "string" ? body.evaluationCriteria.trim() : "",
      deferredNote: unsupported.length ? `V2 후보 도구: ${unsupported.join(", ")}. 지금은 실행하지 않습니다.` : "",
    },
  };
}

export function specialistMayCall(allowed: readonly string[], tool: string) {
  if (!isServerTool(tool)) return "서버 허용 목록에 없는 도구입니다.";
  if (!allowed.includes(tool)) return "이 에이전트에 허용되지 않은 도구입니다.";
  if (!READ_TOOLS.has(tool) && tool !== "draft_document" && tool !== "save_plan" && tool !== "evaluate_result") {
    return "전문 에이전트는 조회와 초안 도구만 실행합니다.";
  }
  return "";
}
