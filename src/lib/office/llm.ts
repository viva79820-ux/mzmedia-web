import { addUsage, getJob } from "@/lib/office/db";

const INPUT_PRICE = 0.15 / 1_000_000;
const OUTPUT_PRICE = 0.6 / 1_000_000;

export async function completeJson(input: { jobId: string; system: string; user: string; remainingUsd: number }) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (input.remainingUsd < 0.01) {
    return { skipped: true as const, reason: "남은 비용 한도가 부족해 API를 호출하지 않았습니다." };
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(25_000),
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    choices?: { message?: { content?: string } }[];
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "언어 모델 호출에 실패했습니다.");
  }

  const tokensIn = payload.usage?.prompt_tokens ?? 0;
  const tokensOut = payload.usage?.completion_tokens ?? 0;
  const costUsd = Number((tokensIn * INPUT_PRICE + tokensOut * OUTPUT_PRICE).toFixed(6));
  await addUsage({ jobId: input.jobId, model, tokensIn, tokensOut, costUsd });
  const job = await getJob(input.jobId);
  if (job && job.costUsd > Number(process.env.OFFICE_MAX_COST_USD ?? 0.5)) {
    throw new Error("API 비용 한도를 초과했습니다.");
  }

  const text = payload.choices?.[0]?.message?.content ?? "";
  return { skipped: false as const, json: JSON.parse(text) as unknown, model, costUsd };
}
