import { NextResponse } from "next/server";
import { answerHome } from "@/lib/home/answer";
import { answeredReplies } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim() ?? "";
  if (message.length < 2) {
    return NextResponse.json({ error: "질문을 적어 주세요." }, { status: 400 });
  }
  const replies = await answeredReplies();
  return NextResponse.json(answerHome(message, replies));
}
