export function selectSnippets(question: string, snippets: string[]) {
  const compact = question.replace(/\s+/g, "");
  const tokens = [...new Set(question.match(/[가-힣A-Za-z]{2,}/g) ?? [])];
  const overlap = snippets.filter((snippet) => tokens.some((token) => snippet.includes(token)));
  if (overlap.length > 0) return overlap.slice(0, 12);
  if (/미수/.test(compact)) return snippets.filter((snippet) => snippet.includes("미수")).slice(0, 12);
  if (/일정|달력/.test(compact)) return snippets.filter((snippet) => snippet.includes("달력")).slice(0, 12);
  if (/업무|수량|범위|자료/.test(compact)) return snippets.filter((snippet) => snippet.includes("업무")).slice(0, 12);
  return [];
}

export function groundedAnswer(question: string, snippets: string[]) {
  const evidence = selectSnippets(question, snippets);
  if (evidence.length === 0) return { answer: "기록에 없습니다.", evidence };
  return {
    answer: `기록에는 다음만 있습니다.\n${evidence.map((line) => `- ${line}`).join("\n")}`,
    evidence,
  };
}

export function answerStaysInside(answer: string, snippets: string[]) {
  if (answer.trim() === "기록에 없습니다.") return true;
  const source = snippets.join("\n");
  const numbers = answer.match(/\d+/g) ?? [];
  if (numbers.some((value) => !source.includes(value))) return false;
  if (answer.includes("원") && !source.includes("원")) return false;
  return true;
}

export function moneyFilled(body: string) {
  return body.split(/\r?\n/).some((line) => /(단가|견적|계약금액|합계|원가|급여)/.test(line) && /\d/.test(line));
}

export function draftBody(input: { customerName: string; kind: string; records: string[] }) {
  const scope = input.records.length > 0 ? input.records.map((record) => `- ${record}`).join("\n") : "기록에 없습니다.";
  return [
    `고객사: ${input.customerName}`,
    `문서: ${input.kind}`,
    "",
    "작업 범위",
    scope,
    "",
    "단가:",
    "견적 합계:",
    "계약금액:",
  ].join("\n");
}
