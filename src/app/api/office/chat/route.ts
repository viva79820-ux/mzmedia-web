import { NextResponse } from "next/server";
import { listPendingAgents, officeTurn, recentTurns } from "@/lib/office/agents";
import { guardOffice } from "@/lib/office/guard";
import { morningBoard } from "@/lib/office/morning";
import { llmEnabled } from "@/lib/office/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  const morning = await morningBoard();
  const opener = [
    morning.meetings.length ? `오늘 상담 ${morning.meetings.length}건` : "오늘 잡힌 상담은 없습니다.",
    morning.videos.length ? `편집 담당이 확인되지 않은 영상 ${morning.videos.length}건` : "편집 공백으로 표시된 영상이 없습니다.",
    `월 수량이 확인된 반복 고객은 없습니다.`,
    morning.collections.length ? `수금 후보 ${morning.collections.length}건. 입금 완료로 보지 않습니다.` : "수금 후보는 확인 필요.",
  ].join(" ");
  return NextResponse.json({
    llm: llmEnabled(),
    opener,
    pending: await listPendingAgents(),
    turns: await recentTurns(),
  });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  try {
    const result = await officeTurn(body?.message ?? "");
    return NextResponse.json({ ...result, pending: await listPendingAgents(), llm: llmEnabled() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "대답하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
