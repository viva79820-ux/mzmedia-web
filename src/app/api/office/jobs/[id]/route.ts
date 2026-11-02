import { NextResponse } from "next/server";
import { cancelJob, detail, pauseJob, remember, resumeJob, runJob } from "@/lib/office/engine";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const denied = await guardOffice();
  if (denied) return denied;
  const { id } = await context.params;
  const data = await detail(id);
  if (!data) return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(request: Request, context: Context) {
  const denied = await guardOffice();
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    title?: string;
    content?: string;
  } | null;

  try {
    if (body?.action === "run") return NextResponse.json(await runJob(id));
    if (body?.action === "pause") return NextResponse.json(await pauseJob(id));
    if (body?.action === "resume") return NextResponse.json(await resumeJob(id));
    if (body?.action === "cancel") return NextResponse.json(await cancelJob(id));
    if (body?.action === "feedback") {
      await remember({ kind: "feedback", title: body.title || "작업 피드백", content: body.content || "", jobId: id });
      return NextResponse.json(await detail(id));
    }
    return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
    const status = message.includes("찾을 수 없") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
