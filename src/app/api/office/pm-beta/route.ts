import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pmBetaKey, pmBetaSource, readPmBeta, type PmBetaJob } from "@/lib/office/pm-beta";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function authorized(request: Request) {
  const token = process.env.PM_BETA_NODE_TOKEN;
  if (!token || token.length < 32) return false;
  const expected = Buffer.from("Bearer " + token);
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || body.node !== "DESKTOP-TGRT0CF") return json({ error: "Invalid node" }, 400);

  if (body.action === "queue") {
    const job: PmBetaJob = { status: "queued", queuedAt: new Date().toISOString() };
    const row = await prisma.osSetting.upsert({
      where: { key: pmBetaKey }, update: {}, create: { key: pmBetaKey, value: JSON.stringify(job) },
    });
    return json({ id: pmBetaKey, status: (JSON.parse(row.value) as PmBetaJob).status });
  }

  const current = await readPmBeta();
  if (!current) return json({ error: "No queued job" }, 404);
  const { row, job } = current;
  if (body.action === "status") {
    return json({ id: pmBetaKey, status: job.status, node: job.node, result: job.result });
  }

  let next: PmBetaJob;
  if (body.action === "claim" && (job.status === "queued" ||
      (job.status === "running" && Date.now() - Date.parse(job.claimedAt ?? "") > 30 * 60_000))) {
    next = { ...job, status: "running", node: body.node, claimedAt: new Date().toISOString(), lease: randomUUID() };
  } else if (body.action === "return" && job.status === "running" &&
      job.node === body.node && job.lease === body.lease &&
      typeof body.fileId === "string" && /^[A-Za-z0-9_-]{15,100}$/.test(body.fileId)) {
    next = { ...job, status: "review", lease: undefined,
      result: "https://drive.google.com/open?id=" + body.fileId, returnedAt: new Date().toISOString() };
  } else {
    return json({ error: "Job transition unavailable" }, 409);
  }

  const updated = await prisma.osSetting.updateMany({
    where: { key: pmBetaKey, value: row.value }, data: { value: JSON.stringify(next) },
  });
  if (updated.count !== 1) return json({ error: "Job changed" }, 409);
  return body.action === "claim"
    ? json({ id: pmBetaKey, role: "PM", source: pmBetaSource, lease: next.lease, status: next.status })
    : json({ id: pmBetaKey, status: next.status, result: next.result });
}
