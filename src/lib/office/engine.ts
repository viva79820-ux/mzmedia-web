import {
  addApproval,
  addImprovement,
  addLog,
  addMemory,
  addPolicy,
  addSteps,
  countJobs,
  createJob,
  getImprovement,
  getJob,
  improvementsForJob,
  jobDetail,
  listImprovements,
  listJobs,
  listMemories,
  listPolicies,
  listSteps,
  pendingApproval,
  stepCount,
  updateApproval,
  updateImprovement,
  updateJob,
  updateStep,
  usageSummary,
} from "@/lib/office/db";
import { limits, llmEnabled } from "@/lib/office/policy";
import { runReadTool } from "@/lib/office/read-tools";
import {
  createPlan,
  draftDocumentTool,
  evaluateTool,
  queryRunsTool,
  savePlanTool,
  searchMemoryTool,
  validateProposal,
} from "@/lib/office/tools";
import type { Job, Step, ToolOutput } from "@/lib/office/types";

const live = new Set<string>();

export function isLive(jobId: string) {
  return live.has(jobId);
}

export async function startJob(goal: string, autoRun: boolean) {
  const text = goal.trim();
  if (text.length < 4) throw new Error("목표는 네 글자 이상 입력해 주세요.");
  if (text.length > 2000) throw new Error("목표는 2000자 안으로 입력해 주세요.");

  const id = await createJob(text);
  await addLog(id, "목표를 접수했습니다.");
  await updateJob(id, { status: "PLANNING" });
  await addLog(id, "목표를 분석하고 실행 계획을 작성합니다.");

  try {
    const job = await must(id);
    const plan = await createPlan(job);
    await updateJob(id, { analysis: plan.analysis, status: "READY" });
    await addSteps(id, plan.steps);
    await addLog(id, `계획 ${plan.steps.length}단계를 저장했습니다. 상태: READY`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "계획 작성에 실패했습니다.";
    await updateJob(id, { status: "FAILED", error: message, finishedAt: new Date().toISOString() });
    await addLog(id, message, "error");
    await addMemory({
      kind: "failure",
      title: `계획 실패: ${text.slice(0, 40)}`,
      content: message,
      jobId: id,
    });
    return detail(id);
  }

  if (!autoRun) return detail(id);
  return runJob(id);
}

export async function runJob(id: string) {
  const job = await must(id);
  if (["COMPLETED", "FAILED", "CANCELLED", "WAITING_APPROVAL"].includes(job.status)) {
    throw new Error("이 상태에서는 실행할 수 없습니다.");
  }
  if (live.has(id)) throw new Error("이미 실행 중입니다.");

  live.add(id);
  await updateJob(id, {
    status: "RUNNING",
    paused: 0,
    startedAt: job.startedAt ?? new Date().toISOString(),
    error: "",
  });
  await addLog(id, job.paused ? "작업을 재개했습니다." : "작업을 실행합니다.");

  const started = Date.now();
  try {
    const pending = (await listSteps(id)).filter((step) => step.status === "pending" || step.status === "running");
    for (const step of pending) {
      const fresh = await must(id);
      if (fresh.status === "CANCELLED") return finishCancelled(id);
      if (fresh.paused) {
        await addLog(id, "대표 요청으로 일시중지했습니다.");
        return detail(id);
      }
      const cap = limits();
      if ((await stepCount(id)) > cap.maxSteps) {
        return fail(id, "작업별 최대 단계 수를 넘었습니다.");
      }
      if (Date.now() - started > cap.maxRuntimeMs) {
        return fail(id, "작업별 최대 실행 시간을 넘었습니다.");
      }
      if (fresh.costUsd > cap.maxCostUsd) {
        return fail(id, "작업별 API 비용 한도를 넘었습니다.");
      }
      await runStep(fresh, step);
      const after = await must(id);
      if (after.status === "FAILED" || after.status === "CANCELLED") return detail(id);
    }
    return await evaluatePhase(id);
  } finally {
    live.delete(id);
  }
}

async function runStep(job: Job, step: Step) {
  const startedAt = new Date().toISOString();
  await updateStep(step.id, { status: "running", startedAt });
  await addLog(job.id, `${step.position}. ${step.title} (${step.tool})`, "info", step.id);
  try {
    const output = await dispatch(await must(job.id), step);
    await updateStep(step.id, { status: "done", output, log: output.summary, finishedAt: new Date().toISOString() });
    await addLog(job.id, output.summary, "info", step.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "단계 실행에 실패했습니다.";
    const output: ToolOutput = { ok: false, summary: message };
    await updateStep(step.id, { status: "failed", output, log: message, finishedAt: new Date().toISOString() });
    await addLog(job.id, message, "error", step.id);
    await fail(job.id, message);
  }
}

async function dispatch(job: Job, step: Step): Promise<ToolOutput> {
  const policies = await listPolicies();
  if (step.tool === "list_tasks" || step.tool === "get_task" || step.tool === "list_leads" || step.tool === "list_projects" || step.tool === "get_project" || step.tool === "list_receivables" || step.tool === "list_employees") {
    const input = step.input && typeof step.input === "object" ? (step.input as Record<string, unknown>) : {};
    return runReadTool(step.tool, input);
  }
  if (step.tool === "search_memory") {
    const query = typeof (step.input as { query?: unknown }).query === "string" ? (step.input as { query: string }).query : job.goal;
    return searchMemoryTool(query);
  }
  if (step.tool === "query_runs") {
    const query = typeof (step.input as { query?: unknown }).query === "string" ? (step.input as { query: string }).query : "";
    return queryRunsTool(query);
  }
  if (step.tool === "save_plan") return savePlanTool(job, policies);
  if (step.tool === "draft_document") return draftDocumentTool(job, policies);
  if (step.tool === "evaluate_result" || step.tool === "propose_improvement" || step.tool === "request_approval") {
    return { ok: true, summary: "이 도구는 평가 단계에서 실행합니다." };
  }
  return { ok: false, summary: "허용되지 않은 도구입니다." };
}

async function evaluatePhase(id: string) {
  await updateJob(id, { status: "EVALUATING" });
  await addLog(id, "실행 결과를 평가합니다.");
  const job = await must(id);
  const evaluation = await evaluateTool(job);
  await addSteps(id, [{ title: "작업 결과 평가", tool: "evaluate_result", input: {} }]);
  const steps = await listSteps(id);
  const marker = steps[steps.length - 1];
  await updateStep(marker.id, {
    status: "done",
    output: evaluation.output,
    log: evaluation.output.summary,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  });
  await addLog(id, evaluation.output.summary);

  if (!evaluation.problem || !evaluation.proposal) {
    await addMemory({
      kind: "success",
      title: `완료: ${job.goal.slice(0, 40)}`,
      content: evaluation.output.summary,
      jobId: id,
    });
    await updateJob(id, { status: "COMPLETED", report: await buildReport(id), finishedAt: new Date().toISOString() });
    await addLog(id, "작업을 완료했습니다.");
    return detail(id);
  }

  const validation = validateProposal(evaluation.proposal);
  const status = validation.ok ? "validated" : "rejected";
  const improvementId = await addImprovement({
    jobId: id,
    problem: evaluation.problem,
    proposal: evaluation.proposal,
    validation: validation.text,
    status,
  });
  await addSteps(id, [{ title: "개선 제안 작성", tool: "propose_improvement", input: {} }]);
  const proposed = (await listSteps(id)).at(-1);
  if (proposed) {
    await updateStep(proposed.id, {
      status: "done",
      output: { ok: validation.ok, summary: validation.text, markdown: evaluation.proposal },
      log: validation.text,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  }
  await addLog(id, validation.text, validation.ok ? "info" : "warn");

  if (!validation.ok) {
    await addMemory({ kind: "failure", title: evaluation.problem.slice(0, 40), content: validation.text, jobId: id });
    await updateJob(id, {
      status: "COMPLETED",
      report: await buildReport(id, "개선안은 검증을 통과하지 못해 적용하지 않았습니다."),
      finishedAt: new Date().toISOString(),
    });
    return detail(id);
  }

  const summary = `개선안 승인 요청: ${evaluation.problem}`;
  await addApproval({ jobId: id, improvementId, summary });
  await addSteps(id, [{ title: "대표 승인 요청", tool: "request_approval", input: {} }]);
  const approvalStep = (await listSteps(id)).at(-1);
  if (approvalStep) {
    await updateStep(approvalStep.id, {
      status: "done",
      output: { ok: true, summary, needsApproval: true },
      log: summary,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  }
  await addLog(id, "대표 승인을 기다립니다.", "warn");
  await updateJob(id, { status: "WAITING_APPROVAL", report: await buildReport(id, "승인 전에는 다음 실행에 반영하지 않습니다.") });
  return detail(id);
}

export async function pauseJob(id: string) {
  const job = await must(id);
  if (job.status !== "RUNNING" && job.status !== "READY") throw new Error("실행 중인 작업만 일시중지할 수 있습니다.");
  await updateJob(id, { paused: 1 });
  await addLog(id, "일시중지를 요청했습니다.");
  return detail(id);
}

export async function resumeJob(id: string) {
  const job = await must(id);
  if (job.status === "WAITING_APPROVAL") throw new Error("승인 대기 중입니다. 승인 또는 거절을 선택해 주세요.");
  if (!job.paused && job.status !== "RUNNING" && job.status !== "READY") {
    throw new Error("재개할 수 있는 상태가 아닙니다.");
  }
  await updateJob(id, { paused: 0 });
  return runJob(id);
}

export async function cancelJob(id: string) {
  const job = await must(id);
  if (["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) throw new Error("이미 끝난 작업입니다.");
  await updateJob(id, { status: "CANCELLED", paused: 0, finishedAt: new Date().toISOString(), error: "" });
  for (const step of await listSteps(id)) {
    if (step.status === "pending" || step.status === "running") {
      await updateStep(step.id, { status: "skipped", log: "중단으로 건너뜀", finishedAt: new Date().toISOString() });
    }
  }
  await addLog(id, "작업을 중단했습니다.", "warn");
  return detail(id);
}

async function finishCancelled(id: string) {
  for (const step of await listSteps(id)) {
    if (step.status === "pending" || step.status === "running") {
      await updateStep(step.id, { status: "skipped", log: "중단으로 건너뜀", finishedAt: new Date().toISOString() });
    }
  }
  return detail(id);
}

async function fail(id: string, message: string) {
  const job = await must(id);
  await updateJob(id, { status: "FAILED", error: message, finishedAt: new Date().toISOString() });
  await addLog(id, message, "error");
  await addMemory({ kind: "failure", title: `실패: ${job.goal.slice(0, 40)}`, content: message, jobId: id });
  await updateJob(id, { report: await buildReport(id, message) });
  return detail(id);
}

export async function decideImprovement(id: string, action: "approve" | "reject") {
  const improvement = await getImprovement(id);
  if (!improvement) throw new Error("개선안을 찾을 수 없습니다.");
  if (improvement.status === "applied" || improvement.status === "rejected") {
    throw new Error("이미 처리한 개선안입니다.");
  }
  const decidedAt = new Date().toISOString();
  if (action === "approve") {
    if (improvement.status !== "validated") throw new Error("검증을 통과한 개선안만 승인할 수 있습니다.");
    await addPolicy(improvement.proposal, improvement.id);
    await updateImprovement(id, { status: "applied", decidedAt });
    await addMemory({
      kind: "improvement",
      title: improvement.problem.slice(0, 40),
      content: improvement.proposal,
      jobId: improvement.jobId,
    });
    if (improvement.jobId) {
      const approval = await pendingApproval(improvement.jobId);
      if (approval) await updateApproval(approval.id, "approved");
      await addLog(improvement.jobId, "대표가 개선안을 승인했습니다. 다음 실행부터 반영합니다.");
      await updateJob(improvement.jobId, {
        status: "COMPLETED",
        report: await buildReport(improvement.jobId, "승인한 개선안은 다음 작업의 계획과 초안에 반영됩니다."),
        finishedAt: decidedAt,
      });
    }
    return improvement.jobId ? detail(improvement.jobId) : null;
  }

  await updateImprovement(id, { status: "rejected", decidedAt });
  if (improvement.jobId) {
    const approval = await pendingApproval(improvement.jobId);
    if (approval) await updateApproval(approval.id, "rejected");
    await addLog(improvement.jobId, "대표가 개선안을 거절했습니다. 다음 실행에 반영하지 않습니다.", "warn");
    await updateJob(improvement.jobId, {
      status: "COMPLETED",
      report: await buildReport(improvement.jobId, "개선안은 거절되어 다음 실행에 반영하지 않습니다."),
      finishedAt: decidedAt,
    });
    return detail(improvement.jobId);
  }
  return null;
}

export async function remember(input: { kind: "feedback" | "rule"; title: string; content: string; jobId?: string }) {
  if (input.title.trim().length < 2 || input.content.trim().length < 4) {
    throw new Error("제목과 내용을 입력해 주세요.");
  }
  await addMemory({ kind: input.kind, title: input.title.trim(), content: input.content.trim(), jobId: input.jobId });
}

export async function summary() {
  const counts = await countJobs();
  const jobs = await listJobs(12);
  const running = jobs.filter((job) => ["RUNNING", "PLANNING", "EVALUATING"].includes(job.status) || job.paused);
  return {
    mode: llmEnabled() ? "api" : "local",
    limits: limits(),
    live: [...live],
    counts: {
      running: (counts.RUNNING ?? 0) + (counts.PLANNING ?? 0) + (counts.EVALUATING ?? 0),
      completed: counts.COMPLETED ?? 0,
      failed: counts.FAILED ?? 0,
      approval: counts.WAITING_APPROVAL ?? 0,
      cancelled: counts.CANCELLED ?? 0,
    },
    running,
    recent: jobs,
    usage: await usageSummary(),
    policies: await listPolicies(),
  };
}

export async function memories(query: string, kind: string) {
  return listMemories(query, kind);
}

export async function improvements() {
  return { items: await listImprovements(), policies: await listPolicies() };
}

export async function listRecent() {
  const jobs = await listJobs(30);
  return jobs.map((job) => ({ ...job, live: live.has(job.id) }));
}

export async function detail(id: string) {
  const data = await jobDetail(id);
  if (!data) return null;
  return { ...data, live: live.has(id), policies: await listPolicies() };
}

async function must(id: string) {
  const job = await getJob(id);
  if (!job) throw new Error("작업을 찾을 수 없습니다.");
  return job;
}

async function buildReport(id: string, note?: string) {
  const job = await must(id);
  const steps = await listSteps(id);
  const draft = [...steps].reverse().find((step) => step.output?.markdown && step.tool === "draft_document");
  const improvements = await improvementsForJob(id);
  return [
    `# 작업 완료 보고서`,
    ``,
    `목표: ${job.goal}`,
    `상태: ${job.status}`,
    job.analysis ? `분석: ${job.analysis}` : ``,
    ``,
    `## 단계`,
    ...steps.map((step) => `- ${step.position}. ${step.title} — ${step.status}. ${step.log}`),
    ``,
    `## 문서 초안`,
    draft?.output?.markdown || "저장된 초안이 없습니다.",
    ``,
    `## 개선`,
    improvements.length
      ? improvements.map((item) => `- ${item.status}: ${item.problem}\n  ${item.validation}`).join("\n")
      : "새 개선안 없음",
    ``,
    note ? `## 기록\n${note}` : ``,
    ``,
    `실행하지 않은 일: 고객 메시지 발송, 결제, 계약 변경, 운영 코드 수정, 운영 서버 작업.`,
    `사용량: 토큰 ${job.tokens}, 추정 비용 US$${job.costUsd.toFixed(4)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
