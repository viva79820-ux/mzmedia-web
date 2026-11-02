import { NextResponse } from "next/server";
import { guardOffice } from "@/lib/office/guard";
import { startProduction, workBoard } from "@/lib/office/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  return NextResponse.json(await workBoard());
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    title?: string;
    dueDate?: string;
    assigneeId?: string;
    businessLine?: string;
  } | null;
  try {
    const result = await startProduction({
      jobId: body?.jobId,
      title: body?.title,
      dueDate: body?.dueDate,
      assigneeId: body?.assigneeId,
      businessLine: body?.businessLine,
    });
    const board = await workBoard();
    return NextResponse.json({ ...result, ...board });
  } catch (error) {
    const message = error instanceof Error ? error.message : "할일을 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
