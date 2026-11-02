import {
  addLog,
  addSteps,
  createJob,
  listPolicies,
  listSteps,
  updateJob,
  updateStep,
} from "@/lib/office/db";
import { detail } from "@/lib/office/engine";
import { completeJson } from "@/lib/office/llm";
import { limits } from "@/lib/office/policy";

export type PackageInput = {
  request: string;
  companyName?: string;
  contactName?: string;
  inquiryId?: string;
};

function serviceOf(text: string) {
  if (/홈페이지|웹사이트|랜딩|개발/.test(text)) return "홈페이지·IT";
  if (/영상|촬영|숏폼|유튜브|편집/.test(text)) return "영상·촬영";
  if (/디자인|인쇄|명함|리플렛|배너/.test(text)) return "디자인·인쇄";
  if (/블로그|인스타|sns|광고|마케팅/.test(text)) return "온라인마케팅";
  if (/렌탈|노트북|대여|장비/.test(text)) return "장비 렌탈";
  if (/강의|교육|출강/.test(text)) return "강의";
  return "상담으로 범위를 확정할 서비스";
}

function mentionedMoney(text: string) {
  const match = text.match(/(\d[\d,만억\s]*)\s*(원|만원|억)/);
  return match ? match[0].replace(/\s+/g, "") : "";
}

export function renderDeliveryPackage(input: PackageInput, rules: string[]) {
  const request = input.request.trim();
  const service = serviceOf(request);
  const who = [input.companyName, input.contactName].filter(Boolean).join(" ");
  const money = mentionedMoney(request);
  const analysis = [
    who ? `${who} 요청입니다.` : `대표가 전달한 고객 요청입니다.`,
    `원하는 결과물은 ${service} 쪽으로 읽힙니다.`,
    `요청 안에 일정, 수정 횟수, 납품 형식이 없으면 미팅에서 확정할 항목으로 남깁니다.`,
    money ? `고객이 말한 금액은 ${money}입니다. 이 금액을 확정 견적으로 쓰지 않습니다.` : `고객이 확정 금액을 말하지 않았습니다.`,
  ].join(" ");

  const quote = [
    `# 견적서 초안`,
    ``,
    `수신: ${who || "고객"}`,
    `서비스: ${service}`,
    ``,
    `| 항목 | 내용 | 금액 |`,
    `| --- | --- | --- |`,
    `| 기획 | 요청 확인과 범위 정리 | 상담 후 확정 |`,
    `| 제작 | ${service} | 예상 범위, 상담 후 확정 |`,
    `| 수정 | 기본 1회 | 상담 후 확정 |`,
    ``,
    money ? `고객 언급 금액: ${money}. 확정 견적이 아닙니다.` : `확정 금액은 적지 않습니다.`,
    `일정은 요청에 적힌 희망일을 참고하고, 착수 후 상담에서 확정합니다.`,
    `이 견적서는 예상 범위입니다. 최종 견적은 상담 후 확정됩니다.`,
  ].join("\n");

  const proposal = [
    `# 제안서 초안`,
    ``,
    `## 이해한 요청`,
    request,
    ``,
    `## 진행`,
    `1. 대표가 범위를 고객과 확인합니다.`,
    `2. 확정된 범위만 제작에 넘깁니다.`,
    `3. 기본 수정 1회 후 납품합니다.`,
    ``,
    `## 엠지미디어가 하는 일`,
    `${service}의 기획과 제작을 맡습니다. 고객 자료가 오기 전에는 제작을 시작하지 않습니다.`,
    ``,
    `## 고객이 준비할 것`,
    `- 꼭 들어가야 할 문구와 빠질 내용`,
    `- 로고, 사진, 기존 자료`,
    `- 참고하고 싶은 사례`,
    ``,
    `## 이번 초안에서 빼 둔 것`,
    `계약 체결, 결제, 세금계산서, 운영 사이트 수정은 포함하지 않았습니다.`,
  ].join("\n");

  const handoff = [
    `안녕하세요. 엠지미디어입니다.`,
    `말씀해 주신 내용을 ${service} 기준으로 정리했습니다.`,
    `첨부한 견적과 제안은 예상 범위이며, 최종 금액과 일정은 상담 후 확정됩니다.`,
    `편하신 때에 범위를 같이 맞추면 됩니다.`,
  ].join(" ");

  return [
    `# 고객 전달 패키지`,
    ``,
    `대표가 고객에게 전달할 초안입니다. 에이전트는 발송하지 않았습니다.`,
    ``,
    `## 내용 분석`,
    analysis,
    ``,
    quote,
    ``,
    proposal,
    ``,
    `## 적용 중인 규칙`,
    rules.length ? rules.map((rule) => `- ${rule}`).join("\n") : "- 승인된 추가 규칙이 없습니다.",
    ``,
    `## 고객에게 붙여 넣을 문장`,
    handoff,
  ].join("\n");
}

export async function openDeliveryPackage(input: PackageInput) {
  const request = input.request.trim();
  if (request.length < 4) throw new Error("고객 요청을 네 글자 이상 적어 주세요.");
  const who = [input.companyName, input.contactName].filter(Boolean).join(" ");
  const goal = `고객 전달 패키지${who ? `: ${who}` : ""}. ${request.slice(0, 120)}`;
  const id = await createJob(goal);
  const policies = await listPolicies();
  const rules = policies.map((policy) => policy.content);
  let markdown = renderDeliveryPackage(input, rules);

  const cap = limits();
  const result = await completeJson({
    jobId: id,
    remainingUsd: cap.maxCostUsd,
    system:
      "당신은 엠지미디어 PM이다. JSON {\"markdown\":\"...\"} 만 반환한다. 내용 분석, 견적서 초안, 제안서 초안, 대표가 고객에게 붙여 넣을 짧은 문장을 한 문서에 넣는다. 이메일 발송, 결제, 계약 체결을 했다고 쓰지 않는다. 금액은 예상 범위이며 상담 후 확정이라고 적는다.",
    user: `고객 요청:\n${request}\n\n회사: ${input.companyName || "미입력"}\n담당: ${input.contactName || "미입력"}\n\n규칙:\n${rules.join("\n") || "없음"}\n\n뼈대:\n${markdown}`,
  }).catch(() => null);

  if (result && !result.skipped) {
    const next = (result.json as { markdown?: unknown }).markdown;
    if (typeof next === "string" && next.trim().length > 40) markdown = next.trim();
  }

  const summary = "분석, 견적서, 제안서를 전달용으로 정리했습니다. 고객에게 보내지 않았습니다.";
  await updateJob(id, {
    status: "COMPLETED",
    analysis: `${serviceOf(request)} 요청으로 읽고, 확정 금액 없이 전달 초안을 만들었습니다.`,
    report: markdown,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  });
  await addSteps(id, [
    { title: "고객 요청 분석", tool: "evaluate_result", input: {} },
    { title: "견적서·제안서 정리", tool: "draft_document", input: {} },
  ]);
  const steps = await listSteps(id);
  for (const step of steps) {
    await updateStep(step.id, {
      status: "done",
      output: { ok: true, summary, markdown: step.tool === "draft_document" ? markdown : undefined },
      log: summary,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  }
  await addLog(id, summary);
  return detail(id);
}
