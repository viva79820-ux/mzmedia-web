import { NextResponse } from "next/server";
import { guardOffice } from "@/lib/office/guard";
import { scheduleConsult, weekBoard } from "@/lib/office/week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const start = new URL(request.url).searchParams.get("start") ?? undefined;
  return NextResponse.json(await weekBoard(start));
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { leadId?: string; date?: string } | null;
  try {
    const board = await scheduleConsult(body?.leadId ?? "", body?.date ?? "");
    return NextResponse.json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "일정을 넣지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
