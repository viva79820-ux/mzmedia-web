import { formatPriceLabel } from "@/lib/catalog";
import type { EstimateResult } from "@/lib/catalog";
import {
  addLog,
  addSteps,
  createJob,
  jobIdForInquiry,
  listPolicies,
  listSteps,
  updateJob,
  updateStep,
} from "@/lib/office/db";
import { detail } from "@/lib/office/engine";

export type InquiryBriefSource = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  serviceName: string;
  budgetLabel: string;
  dueDate: string;
  message: string;
  createdAt: Date;
  product?: { name: string } | null;
  estimateSnapshot: unknown;
};

function won(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function snapshotEstimate(snapshot: unknown): EstimateResult | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const estimate = (snapshot as { estimate?: unknown }).estimate;
  if (!estimate || typeof estimate !== "object") return null;
  return estimate as EstimateResult;
}

export function renderMeetingBrief(inquiry: InquiryBriefSource, rules: string[]) {
  const service = inquiry.serviceName || inquiry.product?.name || "서비스 미지정";
  const estimate = snapshotEstimate(inquiry.estimateSnapshot);
  const price = estimate?.consultOnly || estimate?.total == null
    ? "사이트 계산 금액 없음. 상담에서 범위를 정한 뒤 예상 범위를 말합니다."
    : `${won(estimate.total)} 예상. ${estimate.vatIncluded ? "부가세 포함 계산." : "부가세 별도 계산."} 확정 견적이 아닙니다.`;
  const lines = estimate?.lines?.filter((line) => line.value) ?? [];

  return [
    `# 미팅 브리프`,
    ``,
    `이 문서는 대표 미팅용입니다. 고객에게 보내지 않았습니다.`,
    ``,
    `## 한 줄`,
    `${inquiry.companyName} ${inquiry.contactName}님이 ${service}를 요청했습니다.`,
    ``,
    `## 고객`,
    `- 회사: ${inquiry.companyName}`,
    `- 담당: ${inquiry.contactName}`,
    `- 전화: ${inquiry.phone}`,
    `- 이메일: ${inquiry.email}`,
    `- 접수: ${inquiry.createdAt.toLocaleString("ko-KR")}`,
    ``,
    `## 요청`,
    `- 서비스: ${service}`,
    `- 고객이 적은 예산: ${inquiry.budgetLabel || "없음"}`,
    `- 희망일: ${inquiry.dueDate || "없음"}`,
    ``,
    inquiry.message,
    ``,
    `## 금액`,
    price,
    estimate?.durationLabel ? `참고 기간: ${estimate.durationLabel}` : ``,
    estimate?.note || "최종 범위와 금액은 상담 후 확정합니다.",
    lines.length ? lines.map((line) => `- ${line.label}: ${line.value}${line.amount ? ` (${formatPriceLabel(line.amount)})` : ""}`).join("\n") : ``,
    ``,
    `## 미팅에서 확인할 것`,
    `- 오늘 범위를 확정할 사람이 참석하는지`,
    `- 희망일이 착수일인지, 납품일인지`,
    `- 수정 횟수와 납품 파일 형식이 요청에 들어 있는지`,
    `- 적은 예산이 확정 예산인지, 참고 금액인지`,
    `- 로고, 기존 자료, 참고 사례를 가지고 있는지`,
    ``,
    `## 이미 적용 중인 규칙`,
    rules.length ? rules.map((rule) => `- ${rule}`).join("\n") : "- 승인된 추가 규칙이 없습니다.",
    ``,
    `## 이번 브리프가 하지 않은 일`,
    `고객 메시지 발송, 결제, 계약 변경, 운영 사이트 수정은 하지 않았습니다.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export async function openMeetingBrief(inquiry: InquiryBriefSource) {
  const existing = await jobIdForInquiry(inquiry.id);
  if (existing) return detail(existing);

  const service = inquiry.serviceName || inquiry.product?.name || "견적 문의";
  const goal = `${inquiry.companyName} ${service} 상담 미팅 브리프. 고객에게 보내지 말고 예상 금액만 정리해 줘.`;
  const id = await createJob(goal, inquiry.id);
  const policies = await listPolicies();
  const markdown = renderMeetingBrief(
    inquiry,
    policies.map((policy) => policy.content),
  );
  const summary = "미팅 브리프를 저장했습니다. 고객에게 보내지 않았습니다.";

  await updateJob(id, {
    status: "COMPLETED",
    analysis: `${inquiry.companyName}의 들어온 문의를 미팅 한 장으로 정리했습니다.`,
    report: markdown,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  });
  await addSteps(id, [{ title: "미팅 브리프 작성", tool: "draft_document", input: { inquiryId: inquiry.id } }]);
  const step = (await listSteps(id)).at(-1);
  if (step) {
    await updateStep(step.id, {
      status: "done",
      output: { ok: true, summary, markdown },
      log: summary,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  }
  await addLog(id, summary);
  return detail(id);
}
