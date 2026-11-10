import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateJob } from "@/lib/office/db";
import { guardOffice } from "@/lib/office/guard";
import { readLedger } from "@/lib/office/ledger";
import { applyLedger } from "@/lib/office/ledger-book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { jobId?: string; decision?: string } | null;
  const job = await prisma.officeJob.findUnique({ where: { id: String(body?.jobId ?? "") } });
  if (!job || job.status !== "WAITING_APPROVAL") {
    return NextResponse.json({ error: "이미 처리된 문장입니다." }, { status: 400 });
  }
  const draft = readLedger(job.analysis);
  if (!draft) return NextResponse.json({ error: "장부에 넣을 내용을 찾지 못했습니다." }, { status: 400 });

  if (body?.decision === "hold") {
    await updateJob(job.id, {
      status: "COMPLETED",
      report: "장부에 넣지 않았습니다.",
      finishedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  const report = await applyLedger(draft);
  await updateJob(job.id, {
    status: "COMPLETED",
    report,
    finishedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
