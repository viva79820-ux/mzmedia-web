import type { StaffRole } from "@/generated/prisma/client";

export const SLOT_STATUSES = ["접수", "배정됨", "제작 중", "검수", "완료", "대표확인"] as const;

export function isProductionRole(role: StaffRole) {
  return role === "EMPLOYEE" || role === "FREELANCER";
}

export function canAssignWork(role: StaffRole) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export function seoulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function productionWeek(iso: string) {
  const week = weekdaysOfWeek(iso);
  if (!week.includes(iso)) return week;
  return [iso, ...week.filter((day) => day !== iso)];
}

export function weekdaysOfWeek(iso: string) {
  const [year, mon, day] = iso.split("-").map(Number);
  if (!year || !mon || !day) return [];
  const date = new Date(Date.UTC(year, mon - 1, day));
  const dow = date.getUTCDay();
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return [0, 1, 2, 3, 4].map((offset) => {
    const next = new Date(monday);
    next.setUTCDate(monday.getUTCDate() + offset);
    return next.toISOString().slice(0, 10);
  });
}

export function monthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return parts.slice(0, 7);
}

export function weekdayDates(month: string, start?: string) {
  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon) return [];
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const dates: string[] = [];
  for (let day = 1; day <= last; day += 1) {
    const iso = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (start && iso < start) continue;
    dates.push(iso);
  }
  return dates;
}

export function spreadAcrossWeekdays(month: string, start: string, quantity: number) {
  const fromStart = weekdayDates(month, start);
  const dates = fromStart.length > 0 ? fromStart : weekdayDates(month);
  if (dates.length === 0 || quantity < 1) return [];
  const placed: string[] = [];
  for (let index = 0; index < quantity; index += 1) {
    placed.push(dates[index % dates.length]);
  }
  return placed;
}

export function spreadMonthFrom(month: string, anchor: string, quantity: number) {
  const all = weekdayDates(month);
  if (all.length === 0 || quantity < 1) return [];
  const start = all.indexOf(anchor);
  const dates = start >= 0 ? all.slice(start).concat(all.slice(0, start)) : all;
  const placed: string[] = [];
  for (let index = 0; index < quantity; index += 1) {
    placed.push(dates[index % dates.length]);
  }
  return placed;
}

export function isWeekday(iso: string) {
  const [year, mon, day] = iso.split("-").map(Number);
  if (!year || !mon || !day) return false;
  const dow = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
  return dow !== 0 && dow !== 6;
}

export function monthGrid(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const firstDow = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
  const mondayIndex = firstDow === 0 || firstDow === 6 ? 0 : firstDow - 1;
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: mondayIndex }, () => null);
  for (let day = 1; day <= last; day += 1) {
    const iso = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    cells.push(iso);
  }
  while (cells.length % 5 !== 0) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 5) {
    weeks.push(cells.slice(index, index + 5));
  }
  return weeks;
}

export function shiftMonth(month: string, delta: number) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
