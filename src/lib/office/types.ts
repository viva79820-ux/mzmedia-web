export const STATUSES = [
  "CREATED",
  "PLANNING",
  "READY",
  "RUNNING",
  "EVALUATING",
  "COMPLETED",
  "WAITING_APPROVAL",
  "FAILED",
  "CANCELLED",
] as const;

export type Status = (typeof STATUSES)[number];

export const MEMORY_KINDS = ["success", "failure", "feedback", "rule", "improvement"] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const TOOL_NAMES = [
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

export type ToolName = (typeof TOOL_NAMES)[number];

export type Job = {
  id: string;
  goal: string;
  status: Status;
  analysis: string;
  report: string;
  error: string;
  paused: number;
  costUsd: number;
  tokens: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Step = {
  id: string;
  jobId: string;
  position: number;
  title: string;
  tool: ToolName;
  input: unknown;
  output: ToolOutput | null;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  log: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ToolOutput = {
  ok: boolean;
  summary: string;
  markdown?: string;
  needsApproval?: boolean;
};

export type LogEntry = {
  id: string;
  jobId: string;
  stepId: string | null;
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
};

export type Memory = {
  id: string;
  kind: MemoryKind;
  title: string;
  content: string;
  jobId: string | null;
  createdAt: string;
};

export type Improvement = {
  id: string;
  jobId: string | null;
  problem: string;
  proposal: string;
  validation: string;
  status: "proposed" | "validated" | "applied" | "rejected";
  createdAt: string;
  decidedAt: string | null;
};

export type Approval = {
  id: string;
  jobId: string;
  improvementId: string | null;
  summary: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  decidedAt: string | null;
};

export type Policy = {
  id: string;
  content: string;
  improvementId: string | null;
  active: number;
  createdAt: string;
};

export type PlanStep = {
  title: string;
  tool: ToolName;
  input: Record<string, unknown>;
};
