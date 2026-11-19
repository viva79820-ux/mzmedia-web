const KNOWN_CHANNELS = ["인스타그램", "카드뉴스", "유튜브", "유투브", "블로그", "인스타", "릴스", "숏폼", "쇼츠"];

const ALIASES: Record<string, string[]> = {
  인스타: ["인스타", "인스타그램"],
  인스타그램: ["인스타", "인스타그램"],
  유튜브: ["유튜브", "유투브"],
  유투브: ["유튜브", "유투브"],
  숏폼: ["숏폼", "쇼츠"],
  쇼츠: ["숏폼", "쇼츠"],
};

export const INBOX_QUANTITY_LIMIT = 60;

export type SentenceTask = {
  customerName: string;
  title: string;
  detail: string;
  quantity: number;
  doneCriteria: string;
  month: string;
};

export type SentenceCheck = SentenceTask & { reason: string };

export type SentenceSplit = {
  tasks: SentenceTask[];
  checks: SentenceCheck[];
  error?: string;
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findKnown(part: string) {
  const occupied: Array<[number, number]> = [];
  const found: Array<{ index: number; name: string }> = [];
  for (const name of KNOWN_CHANNELS) {
    let from = 0;
    while (from < part.length) {
      const index = part.indexOf(name, from);
      if (index < 0) break;
      const end = index + name.length;
      const overlaps = occupied.some(([start, stop]) => index < stop && end > start);
      if (!overlaps) {
        occupied.push([index, end]);
        found.push({ index, name });
      }
      from = end;
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

function mentions(scope: string, channel: string) {
  const folded = scope.toLowerCase();
  const names = ALIASES[channel] ?? [channel];
  return names.some((name) => folded.includes(name.toLowerCase()));
}

export function splitWorkSentence(input: {
  sentence: string;
  customerName?: string;
  month: string;
  scopeText?: string;
}): SentenceSplit {
  const sentence = clean(input.sentence.replace(/，/g, ","));
  const month = input.month;
  if (!sentence) return { tasks: [], checks: [], error: "문장을 입력해 주세요." };
  if (!/^\d{4}-\d{2}$/.test(month)) return { tasks: [], checks: [], error: "해당 월이 필요합니다." };

  const each = sentence.match(/(?:월\s*)?(\d+)\s*건\s*각각/);
  const sharedQuantity = each ? Number(each[1]) : null;
  const body = clean(
    sentence
      .replace(/(?:월\s*)?\d+\s*건\s*각각/g, " ")
      .replace(/제작/g, " ")
      .replace(/[.]/g, " "),
  );
  const parts = body.split(/\s*,\s*/).map(clean).filter(Boolean);
  let customerName = clean(input.customerName ?? "");
  const channels: Array<{ name: string; quantity: number | null }> = [];

  parts.forEach((part, index) => {
    const local = part.match(/(\d+)\s*건/);
    const known = findKnown(part);
    if (known.length > 0) {
      if (!customerName && index === 0) {
        customerName = clean(part.slice(0, known[0].index).replace(/[,와과]+$/g, ""));
      }
      for (const channel of known) {
        const window = part.slice(channel.index, channel.index + channel.name.length + 6);
        const own = window.match(/(\d+)\s*건/);
        channels.push({
          name: channel.name,
          quantity: own ? Number(own[1]) : local ? Number(local[1]) : sharedQuantity,
        });
      }
      return;
    }
    const withoutQty = clean(part.replace(/\d+\s*건/g, ""));
    if (!withoutQty) return;
    const tokens = withoutQty.split(" ");
    if (!customerName && index === 0 && tokens.length > 1) {
      customerName = tokens.slice(0, -1).join(" ");
      channels.push({ name: tokens[tokens.length - 1], quantity: local ? Number(local[1]) : sharedQuantity });
      return;
    }
    channels.push({ name: withoutQty, quantity: local ? Number(local[1]) : sharedQuantity });
  });

  if (!customerName) return { tasks: [], checks: [], error: "고객사명이 필요합니다." };
  if (channels.length === 0) {
    return { tasks: [], checks: [], error: "문장에서 채널과 수량을 찾지 못했습니다." };
  }

  const scope = clean(input.scopeText ?? "");
  const tasks: SentenceTask[] = [];
  const checks: SentenceCheck[] = [];
  for (const channel of channels) {
    const quantity = channel.quantity ?? 0;
    const base: SentenceTask = {
      customerName,
      title: channel.name,
      detail: `${channel.name} 월 ${quantity || "?"}건 제작`,
      quantity,
      doneCriteria: quantity > 0 ? `${month}에 ${quantity}건 제작이 끝나면 완료` : "",
      month,
    };
    if (!quantity || quantity < 1) {
      checks.push({ ...base, reason: "문장에서 수량을 찾지 못했습니다." });
      continue;
    }
    if (quantity > INBOX_QUANTITY_LIMIT) {
      checks.push({ ...base, reason: `한 번에 ${INBOX_QUANTITY_LIMIT}건을 넘으면 나눠서 등록합니다.` });
      continue;
    }
    if (scope && !mentions(scope, channel.name)) {
      checks.push({ ...base, reason: `연결된 계약·기획에 ${channel.name} 작업이 없습니다.` });
      continue;
    }
    tasks.push(base);
  }

  if (tasks.length === 0 && checks.length === 0) {
    return { tasks, checks, error: "문장에서 업무를 만들지 못했습니다." };
  }
  return { tasks, checks };
}
