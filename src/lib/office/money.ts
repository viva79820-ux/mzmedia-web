export const COST_CLASSES = ["고정비", "변동비", "금융지출", "세금·보험"] as const;

export function seoulToday(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function nextMonth(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const clamped = Math.min(day, last);
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), clamped))
    .toISOString()
    .slice(0, 10);
}

export function won(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function onOrAfterDay(day: number, from = seoulToday()) {
  const [year, month, today] = from.split("-").map(Number);
  const lastThis = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const clamped = Math.min(Math.max(day, 1), lastThis);
  if (today <= clamped) {
    return `${year}-${String(month).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
  }
  const next = nextMonth(`${year}-${String(month).padStart(2, "0")}-01`);
  const [nextYear, nextMonthNo] = next.split("-").map(Number);
  const lastNext = new Date(Date.UTC(nextYear, nextMonthNo, 0)).getUTCDate();
  return `${nextYear}-${String(nextMonthNo).padStart(2, "0")}-${String(Math.min(Math.max(day, 1), lastNext)).padStart(2, "0")}`;
}
