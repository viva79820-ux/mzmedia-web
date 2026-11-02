import type { ToolName } from "@/lib/office/types";
import { TOOL_NAMES } from "@/lib/office/types";

export function limits() {
  const steps = clamp(Number(process.env.OFFICE_MAX_STEPS ?? 8), 4, 12);
  const runtimeMs = clamp(Number(process.env.OFFICE_MAX_RUNTIME_MS ?? 120_000), 10_000, 300_000);
  const costUsd = clamp(Number(process.env.OFFICE_MAX_COST_USD ?? 0.5), 0, 2);
  return { maxSteps: steps, maxRuntimeMs: runtimeMs, maxCostUsd: costUsd };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const BLOCKED: { pattern: RegExp; reason: string }[] = [
  { pattern: /(이메일|메일|sms|문자).{0,12}(보내|발송|전송)/i, reason: "고객 메시지 발송" },
  { pattern: /(보내|발송|전송).{0,12}(이메일|메일|sms|문자)/i, reason: "고객 메시지 발송" },
  { pattern: /결제|환불|카드\s*승인|입금\s*확인/i, reason: "결제" },
  { pattern: /계약(서)?.{0,8}(변경|해지|수정|체결|갱신)/i, reason: "계약 변경" },
  { pattern: /(운영|프로덕션|실서버).{0,16}(수정|변경|배포|반영)/i, reason: "운영 시스템 변경" },
  { pattern: /(코드|서버).{0,12}(수정|배포|푸시|커밋)/i, reason: "운영 코드 또는 서버 변경" },
  { pattern: /\bgit\s+push\b|\bdeploy\b/i, reason: "운영 배포" },
];

export function blockedReason(text: string) {
  for (const item of BLOCKED) {
    if (item.pattern.test(text)) return item.reason;
  }
  return null;
}

export function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

export function llmEnabled() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
