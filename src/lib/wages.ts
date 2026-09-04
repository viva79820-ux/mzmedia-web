export const DEFAULT_HOURLY_WAGE = 10320;
export const HOLIDAY_MIN_HOURS = 15;
export const STANDARD_WEEK_HOURS = 40;
export const STANDARD_HOLIDAY_HOURS = 8;
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type HoursByDate = Record<string, number>;

export type CalendarDay = {
  ymd: string;
  year: number;
  month: number;
  day: number;
  dow: number;
  inMonth: boolean;
};

export type CalendarWeek = {
  days: CalendarDay[];
};

export type WeekTotals = {
  workHours: number;
  holidayHours: number;
  totalHours: number;
};

export type WageTotals = {
  workHours: number;
  holidayHours: number;
  totalHours: number;
  workPay: number;
  holidayPay: number;
  totalPay: number;
};

export type WorkerRecord = {
  id: string;
  name: string;
  hourlyWage: number;
  holidayPayEnabled: boolean;
};

export type WageSheet = {
  workerId: string;
  year: number;
  month: number;
  hourlyWage: number;
  holidayPayEnabled: boolean;
  hoursByDate: HoursByDate;
  memo: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function koreaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function weekdaySun0(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function weeksOfMonth(year: number, month: number): CalendarWeek[] {
  const dim = daysInMonth(year, month);
  const firstDow = weekdaySun0(year, month, 1);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDim = daysInMonth(prevYear, prevMonth);
  const weeks: CalendarWeek[] = [];
  let days: CalendarDay[] = [];

  for (let i = 0; i < firstDow; i += 1) {
    const day = prevDim - firstDow + 1 + i;
    days.push({
      ymd: toYmd(prevYear, prevMonth, day),
      year: prevYear,
      month: prevMonth,
      day,
      dow: i,
      inMonth: false,
    });
  }

  for (let day = 1; day <= dim; day += 1) {
    days.push({
      ymd: toYmd(year, month, day),
      year,
      month,
      day,
      dow: weekdaySun0(year, month, day),
      inMonth: true,
    });
    if (days.length === 7) {
      weeks.push({ days });
      days = [];
    }
  }

  if (days.length) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    let day = 1;
    while (days.length < 7) {
      days.push({
        ymd: toYmd(nextYear, nextMonth, day),
        year: nextYear,
        month: nextMonth,
        day,
        dow: days.length,
        inMonth: false,
      });
      day += 1;
    }
    weeks.push({ days });
  }

  return weeks;
}

export function parseHours(value: string) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(24, Math.round(n * 100) / 100);
}

export function parseMoney(value: string) {
  const cleaned = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function money(n: number) {
  return Math.round(Number(n) || 0).toLocaleString("ko-KR");
}

export function formatHours(n: number) {
  const v = Number(n) || 0;
  if (v === 0) return "";
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

export function displayHours(n: number) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return Number.isInteger(v) ? String(v) : String(v);
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function asHoursMap(value: unknown): HoursByDate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: HoursByDate = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) out[key] = Math.round(n * 100) / 100;
  }
  return out;
}

export function holidayHoursForWeek(weeklyHours: number, enabled: boolean) {
  if (!enabled) return 0;
  if (weeklyHours < HOLIDAY_MIN_HOURS) return 0;
  return (
    Math.round(
      (weeklyHours / STANDARD_WEEK_HOURS) * STANDARD_HOLIDAY_HOURS * 100,
    ) / 100
  );
}

export function weekHours(week: CalendarWeek, hoursByDate: HoursByDate) {
  return week.days.reduce((sum, day) => {
    if (!day.inMonth) return sum;
    return sum + (Number(hoursByDate[day.ymd]) || 0);
  }, 0);
}

export function summarizeWeek(
  week: CalendarWeek,
  hoursByDate: HoursByDate,
  holidayPayEnabled: boolean,
): WeekTotals {
  const workHours =
    Math.round(weekHours(week, hoursByDate) * 100) / 100;
  const holidayHours = holidayHoursForWeek(workHours, holidayPayEnabled);
  return {
    workHours,
    holidayHours,
    totalHours: Math.round((workHours + holidayHours) * 100) / 100,
  };
}

export function summarizeMonth(
  weeks: CalendarWeek[],
  hoursByDate: HoursByDate,
  holidayPayEnabled: boolean,
  hourlyWage: number,
): WageTotals {
  const weekTotals = weeks.map((week) =>
    summarizeWeek(week, hoursByDate, holidayPayEnabled),
  );
  const workHours =
    Math.round(weekTotals.reduce((s, w) => s + w.workHours, 0) * 100) / 100;
  const holidayHours =
    Math.round(weekTotals.reduce((s, w) => s + w.holidayHours, 0) * 100) / 100;
  const totalHours = Math.round((workHours + holidayHours) * 100) / 100;
  const wage = Number(hourlyWage) || 0;
  const workPay = Math.round(workHours * wage);
  const holidayPay = Math.round(holidayHours * wage);
  return {
    workHours,
    holidayHours,
    totalHours,
    workPay,
    holidayPay,
    totalPay: workPay + holidayPay,
  };
}
