import { NextResponse } from "next/server";
import { answerFromApproved, answerHome } from "@/lib/home/answer";
import { recentMemory, recordAsk, reusableAsks } from "@/lib/home/asks";
import { answerHomeWithModel } from "@/lib/home/model";
import { answeredReplies } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

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
  const body = (await request.json().catch(() => null)) as {
    message?: string;
    history?: { question?: string; answer?: string }[];
  } | null;
  const message = body?.message?.trim() ?? "";
  const history = (Array.isArray(body?.history) ? body.history : [])
    .slice(-6)
    .flatMap((item) => {
      const question = item?.question?.trim().slice(0, 500) ?? "";
      const answer = item?.answer?.trim().slice(0, 800) ?? "";
      return question && answer ? [{ question, answer }] : [];
    });
  if (message.length < 2 || message.length > 800) {
    return NextResponse.json({ error: "질문은 2자 이상 800자 이하로 적어 주세요." }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowQuestion(ip)) {
    return NextResponse.json({ error: "질문이 너무 빠릅니다. 잠시 후 다시 검색해 주세요." }, { status: 429 });
  }

  const [replies, approved, memory] = await Promise.all([
    answeredReplies(),
    reusableAsks().catch(() => []),
    recentMemory().catch(() => []),
  ]);
  const learned = answerFromApproved(message, approved);
  const fallback = learned ?? answerHome(message, replies);
  let answer = fallback;
  if (!learned) {
    try {
      const modeled = await answerHomeWithModel(message, memory, history);
      if ("answer" in modeled) answer = modeled.answer;
      else if (modeled.status) console.error(`home model status ${modeled.status}`);
    } catch {
      answer = fallback;
    }
  }
  await recordAsk({ question: message, answer: answer.markdown, needsInquiry: answer.needsInquiry }).catch(() => undefined);
  return NextResponse.json(answer);
}
