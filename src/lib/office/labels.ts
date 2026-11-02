import type { MemoryKind, Status } from "@/lib/office/types";

export const STATUS_LABEL: Record<Status, string> = {
  CREATED: "생성됨",
  PLANNING: "계획 중",
  READY: "실행 대기",
  RUNNING: "실행 중",
  EVALUATING: "평가 중",
  COMPLETED: "완료",
  WAITING_APPROVAL: "승인 대기",
  FAILED: "실패",
  CANCELLED: "중단됨",
};

export const MEMORY_LABEL: Record<MemoryKind, string> = {
  success: "성공",
  failure: "실패",
  feedback: "피드백",
  rule: "업무 규칙",
  improvement: "개선 이력",
};

export const ACTIVE_STATUSES: Status[] = ["CREATED", "PLANNING", "READY", "RUNNING", "EVALUATING"];

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatUsd(value: number) {
  return `US$${value.toFixed(4)}`;
}
