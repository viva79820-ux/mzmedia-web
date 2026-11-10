import { addDays, onOrAfterDay, seoulToday, won } from "@/lib/office/money";

export type LedgerDraft =
  | { action: "cash"; amount: number; summary: string }
  | {
      action: "cost";
      label: string;
      category: "고정비" | "변동비" | "금융지출" | "세금·보험";
      amount: number;
      spentAt: string;
      recurring: boolean;
      summary: string;
    }
  | {
      action: "payment";
      customer: string;
      kind: "DEPOSIT" | "MILESTONE" | "FINAL" | "OTHER";
      amount: number;
      date: string;
      received: boolean;
      label: string;
      summary: string;
    };

export type LedgerRead =
  | { type: "draft"; draft: LedgerDraft }
  | { type: "clarify"; question: string }
  | null;

const KIND_LABEL = { DEPOSIT: "계약금", MILESTONE: "중도금", FINAL: "잔금", OTHER: "수금" } as const;

export function parseLedger(text: string, today = seoulToday()): LedgerRead {
  const source = text.trim();
  if (source.length < 2) return null;
  const payment = /입금|수금|미수|청구|계약금|중도금|잔금|받았|들어왔/.test(source);
  const cost = /지출|비용|고정비|변동비|금융지출|임대료|월세|급여|광고비|수수료|보험료|세금|보험/.test(source);
  const cash = /현금|통장/.test(source) && !payment;
  if (!payment && !cost && !cash) return null;

  const dated = takeDate(source, today);
  const money = takeAmount(dated.rest);
  if (!money) return null;

  if (cash && !cost && !payment) {
    const draft: LedgerDraft = {
      action: "cash",
      amount: money.amount,
      summary: `가용현금을 ${won(money.amount)}으로 맞춥니다.`,
    };
    return { type: "draft", draft };
  }

  if (cost && !payment) {
    const category = costCategory(source);
    const label = costLabel(source);
    const repeat = dated.recurring ? ` 매월 ${Number(dated.date.slice(8, 10))}일에 반복합니다.` : "";
    const draft: LedgerDraft = {
      action: "cost",
      label,
      category,
      amount: money.amount,
      spentAt: dated.date,
      recurring: dated.recurring,
      summary: `${label} ${won(money.amount)}을 ${category}로 ${dated.date} 지출에 넣습니다.${repeat}`,
    };
    return { type: "draft", draft };
  }

  const customer = personName(money.rest);
  if (!customer) {
    return { type: "clarify", question: "어느 고객의 돈인지 고객명을 같이 적어 주세요. 예: 한빛식품 잔금 150만 오늘 입금" };
  }
  const kind = paymentKind(source);
  const received = /입금|받았|들어왔/.test(source);
  const label = KIND_LABEL[kind];
  const draft: LedgerDraft = {
    action: "payment",
    customer,
    kind,
    amount: money.amount,
    date: dated.date,
    received,
    label,
    summary: received
      ? `${customer} ${label} ${won(money.amount)}을 ${dated.date} 입금으로 수금·미수에 넣습니다.`
      : `${customer} ${label} ${won(money.amount)}을 ${dated.date} 예정으로 수금·미수에 넣습니다. 입금 완료로 바꾸지는 않습니다.`,
  };
  return { type: "draft", draft };
}

export function encodeLedger(draft: LedgerDraft) {
  return `ledger:${JSON.stringify(draft)}`;
}

export function readLedger(analysis: string): LedgerDraft | null {
  if (!analysis.startsWith("ledger:")) return null;
  try {
    const value = JSON.parse(analysis.slice("ledger:".length)) as Partial<LedgerDraft>;
    if (!value || typeof value.amount !== "number" || value.amount <= 0 || typeof value.summary !== "string") return null;
    if (value.action === "cash") return { action: "cash", amount: Math.round(value.amount), summary: value.summary };
    if (value.action === "cost") {
      const category = value.category === "고정비" || value.category === "금융지출" || value.category === "세금·보험" ? value.category : "변동비";
      if (typeof value.label !== "string" || typeof value.spentAt !== "string") return null;
      return {
        action: "cost",
        label: value.label.slice(0, 80),
        category,
        amount: Math.round(value.amount),
        spentAt: value.spentAt.slice(0, 10),
        recurring: Boolean(value.recurring),
        summary: value.summary,
      };
    }
    if (value.action === "payment") {
      const kind = value.kind === "DEPOSIT" || value.kind === "MILESTONE" || value.kind === "FINAL" ? value.kind : "OTHER";
      if (typeof value.customer !== "string" || typeof value.date !== "string" || typeof value.label !== "string") return null;
      return {
        action: "payment",
        customer: value.customer.slice(0, 40),
        kind,
        amount: Math.round(value.amount),
        date: value.date.slice(0, 10),
        received: Boolean(value.received),
        label: value.label.slice(0, 80),
        summary: value.summary,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function paymentKind(text: string): "DEPOSIT" | "MILESTONE" | "FINAL" | "OTHER" {
  if (/계약금/.test(text)) return "DEPOSIT";
  if (/중도금/.test(text)) return "MILESTONE";
  if (/잔금/.test(text)) return "FINAL";
  return "OTHER";
}

function costCategory(text: string): "고정비" | "변동비" | "금융지출" | "세금·보험" {
  if (/금융/.test(text)) return "금융지출";
  if (/세금|보험/.test(text)) return "세금·보험";
  if (/변동비/.test(text)) return "변동비";
  if (/고정비|임대|월세|급여/.test(text)) return "고정비";
  return "변동비";
}

function costLabel(text: string) {
  const known = text.match(/임대료|월세|급여|광고비|수수료|보험료/);
  if (known) return known[0];
  const name = personName(text);
  return name || "지출";
}

function personName(text: string) {
  const cleaned = text
    .replace(/계약금|중도금|잔금|입금|수금|미수금|미수|청구|받았어|받았|들어왔습니다|들어왔|지출|비용|고정비|변동비|금융지출|임대료|월세|급여|광고비|수수료|보험료|세금|보험|매월|오늘|내일|모레|현금|가용|잔액|통장|보유|맞춰|정리해|정리|해주세요|해줘|부탁|으로|에서|에게|까지|부터|하고|그리고|\d+(?:\.\d+)?\s*(?:억|만|천)?\s*원?/g, " ")
    .replace(/[^\p{Script=Hangul}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 40);
}

function takeAmount(source: string) {
  const match = source.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(억|만|천)?\s*원?/);
  if (!match) return null;
  const unit = match[2];
  const hasWon = match[0].includes("원");
  if (!unit && !hasWon && !match[1].includes(",")) return null;
  const value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  const multiplier = unit === "억" ? 100_000_000 : unit === "만" ? 10_000 : unit === "천" ? 1_000 : 1;
  return { amount: Math.round(value * multiplier), rest: source.replace(match[0], " ") };
}

function takeDate(source: string, today: string) {
  let rest = source;
  let date = today;
  let recurring = false;
  const monthly = rest.match(/매월\s*(\d{1,2})\s*일/);
  if (monthly) {
    recurring = true;
    date = onOrAfterDay(Number(monthly[1]), today);
    rest = rest.replace(monthly[0], " ");
  }
  const iso = rest.match(/\d{4}-\d{2}-\d{2}/);
  if (iso && !monthly) {
    date = iso[0];
    rest = rest.replace(iso[0], " ");
  }
  const monthDay = rest.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (monthDay && !monthly && !iso) {
    date = calendarDay(Number(monthDay[1]), Number(monthDay[2]), today);
    rest = rest.replace(monthDay[0], " ");
  }
  if (!monthly && !iso && !monthDay) {
    if (rest.includes("모레")) {
      date = addDays(today, 2);
      rest = rest.replace(/모레/g, " ");
    } else if (rest.includes("내일")) {
      date = addDays(today, 1);
      rest = rest.replace(/내일/g, " ");
    } else if (rest.includes("오늘")) {
      rest = rest.replace(/오늘/g, " ");
    }
  }
  return { date, recurring, rest };
}

function calendarDay(month: number, day: number, today: string) {
  const [year, thisMonth] = today.split("-").map(Number);
  const safeMonth = Math.min(Math.max(month, 1), 12);
  const useYear = safeMonth < thisMonth ? year + 1 : year;
  const last = new Date(Date.UTC(useYear, safeMonth, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(day, 1), last);
  return `${useYear}-${String(safeMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}
