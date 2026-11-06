import { NextResponse } from "next/server";
import { answerHome } from "@/lib/home/answer";
import { answerHomeWithModel } from "@/lib/home/model";
import { answeredReplies } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function allowQuestion(ip: string) {
  const now = Date.now();
  if (hits.size > 500) hits.clear();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 10) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim() ?? "";
  if (message.length < 2 || message.length > 800) {
    return NextResponse.json({ error: "질문은 2자 이상 800자 이하로 적어 주세요." }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowQuestion(ip)) {
    return NextResponse.json({ error: "질문이 너무 빠릅니다. 잠시 후 다시 검색해 주세요." }, { status: 429 });
  }

  const replies = await answeredReplies();
  const fallback = answerHome(message, replies);
  if (!fallback.needsInquiry) return NextResponse.json(fallback);

  try {
    const modeled = await answerHomeWithModel(message, replies);
    if (modeled) return NextResponse.json(modeled);
  } catch {
    // 모델이 없거나 호출에 실패하면 공개 안내 문장으로 답합니다.
  }
  return NextResponse.json(fallback);
}
