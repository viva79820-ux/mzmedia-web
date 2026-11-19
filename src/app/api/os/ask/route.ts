import { NextResponse } from "next/server";
import { answerStaysInside, groundedAnswer } from "@/lib/work-ask";
import { evidenceLines } from "@/lib/work-evidence";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const ASKING = new Set(["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"]);

async function phrase(question: string, evidence: string[]) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || evidence.length === 0) return "";
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "근거에 있는 문장만 사용해 답한다. 근거에 없는 고객사, 수량, 일정, 금액, 범위를 만들지 않는다. 근거로 답할 수 없으면 answer는 정확히 기록에 없습니다. 이다. JSON {\"answer\":\"...\"}",
        },
        { role: "user", content: JSON.stringify({ question, evidence }) },
      ],
    }),
  });
  if (!response.ok) return "";
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  try {
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "") as { answer?: string };
    return String(parsed.answer ?? "");
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!ASKING.has(staff.role)) return NextResponse.json({ ok: false }, { status: 403 });
    const body = (await request.json()) as { question?: string };
    const question = String(body.question ?? "").trim();
    if (!question) return NextResponse.json({ ok: false, error: "질문을 입력해 주세요." }, { status: 400 });

    const snippets = await evidenceLines(staff);
    const grounded = groundedAnswer(question, snippets);
    let answer = grounded.answer;
    if (grounded.evidence.length > 0) {
      const phrased = await phrase(question, grounded.evidence);
      if (phrased && phrased.trim() !== "기록에 없습니다." && answerStaysInside(phrased, grounded.evidence)) answer = phrased;
    }
    return NextResponse.json({ answer, evidence: grounded.evidence });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
