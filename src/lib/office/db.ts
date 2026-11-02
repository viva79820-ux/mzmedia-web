import { prisma } from "@/lib/db";
import type {
  Approval,
  Improvement,
  Job,
  LogEntry,
  Memory,
  MemoryKind,
  PlanStep,
  Policy,
  Status,
  Step,
  ToolName,
  ToolOutput,
} from "@/lib/office/types";

type JobPatch = Partial<{
  status: Status;
  analysis: string;
  report: string;
  error: string;
  paused: number;
  costUsd: number;
  tokens: number;
  startedAt: string | null;
  finishedAt: string | null;
}>;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapJob(row: {
  id: string;
  goal: string;
  status: string;
  analysis: string;
  report: string;
  error: string;
  paused: boolean;
  costUsd: number;
  tokens: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Job {
  return {
    id: row.id,
    goal: row.goal,
    status: row.status as Status,
    analysis: row.analysis,
    report: row.report,
    error: row.error,
    paused: row.paused ? 1 : 0,
    costUsd: row.costUsd,
    tokens: row.tokens,
    startedAt: iso(row.startedAt),
    finishedAt: iso(row.finishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapStep(row: {
  id: string;
  jobId: string;
  position: number;
  title: string;
  tool: string;
  inputJson: string;
  outputJson: string | null;
  status: string;
  log: string;
  startedAt: Date | null;
  finishedAt: Date | null;
}): Step {
  return {
    id: row.id,
    jobId: row.jobId,
    position: row.position,
    title: row.title,
    tool: row.tool as ToolName,
    input: JSON.parse(row.inputJson || "{}") as unknown,
    output: row.outputJson ? (JSON.parse(row.outputJson) as ToolOutput) : null,
    status: row.status as Step["status"],
    log: row.log,
    startedAt: iso(row.startedAt),
    finishedAt: iso(row.finishedAt),
  };
}

function mapMemory(row: {
  id: string;
  kind: string;
  title: string;
  content: string;
  jobId: string | null;
  createdAt: Date;
}): Memory {
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    title: row.title,
    content: row.content,
    jobId: row.jobId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapImprovement(row: {
  id: string;
  jobId: string | null;
  problem: string;
  proposal: string;
  validation: string;
  status: string;
  createdAt: Date;
  decidedAt: Date | null;
}): Improvement {
  return {
    id: row.id,
    jobId: row.jobId,
    problem: row.problem,
    proposal: row.proposal,
    validation: row.validation,
    status: row.status as Improvement["status"],
    createdAt: row.createdAt.toISOString(),
    decidedAt: iso(row.decidedAt),
  };
}

function mapApproval(row: {
  id: string;
  jobId: string;
  improvementId: string | null;
  summary: string;
  status: string;
  createdAt: Date;
  decidedAt: Date | null;
}): Approval {
  return {
    id: row.id,
    jobId: row.jobId,
    improvementId: row.improvementId,
    summary: row.summary,
    status: row.status as Approval["status"],
    createdAt: row.createdAt.toISOString(),
    decidedAt: iso(row.decidedAt),
  };
}

export async function createJob(goal: string) {
  const row = await prisma.officeJob.create({
    data: { goal, status: "CREATED" },
  });
  return row.id;
}

export async function updateJob(id: string, patch: JobPatch) {
  await prisma.officeJob.update({
    where: { id },
    data: {
      status: patch.status,
      analysis: patch.analysis,
      report: patch.report,
      error: patch.error,
      paused: patch.paused === undefined ? undefined : patch.paused === 1,
      costUsd: patch.costUsd,
      tokens: patch.tokens,
      startedAt: patch.startedAt === undefined ? undefined : patch.startedAt ? new Date(patch.startedAt) : null,
      finishedAt: patch.finishedAt === undefined ? undefined : patch.finishedAt ? new Date(patch.finishedAt) : null,
    },
  });
}

export async function getJob(id: string) {
  const row = await prisma.officeJob.findUnique({ where: { id } });
  return row ? mapJob(row) : null;
}

export async function listJobs(limit = 30) {
  const rows = await prisma.officeJob.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(mapJob);
}

export async function countJobs() {
  const rows = await prisma.officeJob.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function addSteps(jobId: string, steps: PlanStep[]) {
  const current = await prisma.officeStep.aggregate({ where: { jobId }, _max: { position: true } });
  let position = current._max.position ?? 0;
  await prisma.officeStep.createMany({
    data: steps.map((step) => {
      position += 1;
      return {
        jobId,
        position,
        title: step.title,
        tool: step.tool,
        inputJson: JSON.stringify(step.input ?? {}),
        status: "pending",
      };
    }),
  });
}

export async function stepCount(jobId: string) {
  return prisma.officeStep.count({ where: { jobId } });
}

export async function listSteps(jobId: string) {
  const rows = await prisma.officeStep.findMany({ where: { jobId }, orderBy: { position: "asc" } });
  return rows.map(mapStep);
}

export async function updateStep(
  id: string,
  patch: Partial<{ status: Step["status"]; output: ToolOutput | null; log: string; startedAt: string | null; finishedAt: string | null }>,
) {
  await prisma.officeStep.update({
    where: { id },
    data: {
      status: patch.status,
      outputJson: patch.output === undefined ? undefined : patch.output ? JSON.stringify(patch.output) : null,
      log: patch.log,
      startedAt: patch.startedAt === undefined ? undefined : patch.startedAt ? new Date(patch.startedAt) : null,
      finishedAt: patch.finishedAt === undefined ? undefined : patch.finishedAt ? new Date(patch.finishedAt) : null,
    },
  });
}

export async function addLog(jobId: string, message: string, level: LogEntry["level"] = "info", stepId?: string) {
  await prisma.officeLog.create({
    data: { jobId, stepId: stepId ?? null, level, message },
  });
}

export async function listLogs(jobId: string) {
  const rows = await prisma.officeLog.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    jobId: row.jobId,
    stepId: row.stepId,
    level: row.level as LogEntry["level"],
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addMemory(input: { kind: MemoryKind; title: string; content: string; jobId?: string | null }) {
  const row = await prisma.officeMemory.create({
    data: { kind: input.kind, title: input.title, content: input.content, jobId: input.jobId ?? null },
  });
  return row.id;
}

export async function listMemories(query = "", kind = "") {
  const rows = await prisma.officeMemory.findMany({
    where: {
      AND: [
        query
          ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { content: { contains: query, mode: "insensitive" } }] }
          : {},
        kind ? { kind } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return rows.map(mapMemory);
}

export async function addImprovement(input: {
  jobId: string;
  problem: string;
  proposal: string;
  validation: string;
  status: Improvement["status"];
}) {
  const row = await prisma.officeImprovement.create({
    data: input,
  });
  return row.id;
}

export async function updateImprovement(
  id: string,
  patch: Partial<{ status: Improvement["status"]; validation: string; decidedAt: string | null }>,
) {
  await prisma.officeImprovement.update({
    where: { id },
    data: {
      status: patch.status,
      validation: patch.validation,
      decidedAt: patch.decidedAt === undefined ? undefined : patch.decidedAt ? new Date(patch.decidedAt) : null,
    },
  });
}

export async function listImprovements() {
  const rows = await prisma.officeImprovement.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
  return rows.map(mapImprovement);
}

export async function getImprovement(id: string) {
  const row = await prisma.officeImprovement.findUnique({ where: { id } });
  return row ? mapImprovement(row) : null;
}

export async function improvementsForJob(jobId: string) {
  const rows = await prisma.officeImprovement.findMany({ where: { jobId }, orderBy: { createdAt: "desc" } });
  return rows.map(mapImprovement);
}

export async function addApproval(input: { jobId: string; improvementId: string; summary: string }) {
  const row = await prisma.officeApproval.create({
    data: { jobId: input.jobId, improvementId: input.improvementId, summary: input.summary, status: "pending" },
  });
  return row.id;
}

export async function pendingApproval(jobId: string) {
  const row = await prisma.officeApproval.findFirst({
    where: { jobId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapApproval(row) : null;
}

export async function approvalsForJob(jobId: string) {
  const rows = await prisma.officeApproval.findMany({ where: { jobId }, orderBy: { createdAt: "desc" } });
  return rows.map(mapApproval);
}

export async function updateApproval(id: string, status: Approval["status"]) {
  await prisma.officeApproval.update({ where: { id }, data: { status, decidedAt: new Date() } });
}

export async function addPolicy(content: string, improvementId: string) {
  const row = await prisma.officePolicy.create({ data: { content, improvementId, active: true } });
  return row.id;
}

export async function listPolicies() {
  const rows = await prisma.officePolicy.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  return rows.map(
    (row) =>
      ({
        id: row.id,
        content: row.content,
        improvementId: row.improvementId,
        active: row.active ? 1 : 0,
        createdAt: row.createdAt.toISOString(),
      }) satisfies Policy,
  );
}

export async function addUsage(input: { jobId: string | null; model: string; tokensIn: number; tokensOut: number; costUsd: number }) {
  await prisma.officeUsage.create({
    data: {
      jobId: input.jobId,
      model: input.model,
      tokensIn: input.tokensIn,
      tokensOut: input.tokensOut,
      costUsd: input.costUsd,
    },
  });
  if (!input.jobId) return;
  const job = await getJob(input.jobId);
  if (!job) return;
  await updateJob(input.jobId, {
    tokens: job.tokens + input.tokensIn + input.tokensOut,
    costUsd: Number((job.costUsd + input.costUsd).toFixed(6)),
  });
}

export async function usageSummary() {
  const row = await prisma.officeUsage.aggregate({
    _count: { _all: true },
    _sum: { tokensIn: true, tokensOut: true, costUsd: true },
  });
  return {
    calls: row._count._all,
    tokens: (row._sum.tokensIn ?? 0) + (row._sum.tokensOut ?? 0),
    costUsd: row._sum.costUsd ?? 0,
  };
}

export async function jobDetail(id: string) {
  const job = await getJob(id);
  if (!job) return null;
  const [steps, logs, improvements, approvals] = await Promise.all([
    listSteps(id),
    listLogs(id),
    improvementsForJob(id),
    approvalsForJob(id),
  ]);
  return { job, steps, logs, improvements, approvals };
}
