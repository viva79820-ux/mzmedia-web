"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_HOURLY_WAGE,
  WEEKDAYS,
  asHoursMap,
  displayHours,
  formatHours,
  money,
  parseHours,
  parseMoney,
  shiftMonth,
  summarizeMonth,
  summarizeWeek,
  weeksOfMonth,
  type HoursByDate,
  type WageSheet,
  type WorkerRecord,
} from "@/lib/wages";

export function WageBoard({
  initialYear,
  initialMonth,
}: {
  initialYear: number;
  initialMonth: number;
}) {
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [name, setName] = useState("");
  const [hourlyWage, setHourlyWage] = useState(DEFAULT_HOURLY_WAGE);
  const [holidayPayEnabled, setHolidayPayEnabled] = useState(true);
  const [hoursByDate, setHoursByDate] = useState<HoursByDate>({});
  const [memo, setMemo] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef<number>(0);
  const skipSave = useRef(true);

  const weeks = useMemo(() => weeksOfMonth(year, month), [year, month]);
  const totals = useMemo(
    () => summarizeMonth(weeks, hoursByDate, holidayPayEnabled, hourlyWage),
    [weeks, hoursByDate, holidayPayEnabled, hourlyWage],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const applySheet = useCallback((worker: WorkerRecord, sheet: WageSheet) => {
    skipSave.current = true;
    setWorkerId(worker.id);
    setName(worker.name);
    setHourlyWage(sheet.hourlyWage);
    setHolidayPayEnabled(sheet.holidayPayEnabled);
    setHoursByDate(asHoursMap(sheet.hoursByDate));
    setMemo(sheet.memo || "");
    setDrafts({});
  }, []);

  const loadWorkers = useCallback(async () => {
    const res = await fetch("/api/admin/workers");
    if (res.status === 401) {
      router.replace("/admin");
      return [];
    }
    if (!res.ok) throw new Error("직원 목록을 불러오지 못했습니다.");
    const data = (await res.json()) as { workers: WorkerRecord[] };
    setWorkers(data.workers || []);
    return data.workers || [];
  }, [router]);

  const loadSheet = useCallback(
    async (id: string, y: number, m: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/wages?workerId=${encodeURIComponent(id)}&year=${y}&month=${m}`,
        );
        if (res.status === 401) {
          router.replace("/admin");
          return;
        }
        if (!res.ok) throw new Error("근무표를 불러오지 못했습니다.");
        const data = (await res.json()) as {
          worker: WorkerRecord;
          sheet: WageSheet;
        };
        applySheet(data.worker, data.sheet);
        setWorkers((prev) =>
          prev.map((w) => (w.id === data.worker.id ? data.worker : w)),
        );
      } finally {
        setLoading(false);
      }
    },
    [applySheet, router],
  );

  useEffect(() => {
    loadWorkers()
      .then((list) => {
        if (list[0]) {
          setWorkerId(list[0].id);
        }
      })
      .catch((e: Error) => showToast(e.message));
  }, [loadWorkers, showToast]);

  useEffect(() => {
    skipSave.current = true;
  }, [workerId, year, month]);

  useEffect(() => {
    if (!workerId) return;
    loadSheet(workerId, year, month).catch((e: Error) => showToast(e.message));
  }, [workerId, year, month, loadSheet, showToast]);

  const persist = useCallback(
    async (next: {
      name: string;
      hourlyWage: number;
      holidayPayEnabled: boolean;
      hoursByDate: HoursByDate;
      memo: string;
    }) => {
      if (!workerId) return;
      const res = await fetch("/api/admin/wages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          year,
          month,
          ...next,
        }),
      });
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (!res.ok) throw new Error("저장 실패");
      const data = (await res.json()) as { worker: WorkerRecord };
      setWorkers((prev) =>
        prev.map((w) => (w.id === data.worker.id ? data.worker : w)),
      );
    },
    [month, router, workerId, year],
  );

  function scheduleSave(next: {
    name: string;
    hourlyWage: number;
    holidayPayEnabled: boolean;
    hoursByDate: HoursByDate;
    memo: string;
  }) {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persist(next).catch((e: Error) => showToast(e.message));
    }, 350);
  }

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (!workerId) return;
    scheduleSave({
      name,
      hourlyWage,
      holidayPayEnabled,
      hoursByDate,
      memo,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, hourlyWage, holidayPayEnabled, hoursByDate, memo, workerId]);

  async function addWorker() {
    const trimmed = newName.trim();
    if (!trimmed) {
      showToast("직원 이름을 입력해 주세요.");
      return;
    }
    const res = await fetch("/api/admin/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        hourlyWage: DEFAULT_HOURLY_WAGE,
        holidayPayEnabled: true,
      }),
    });
    if (!res.ok) throw new Error("직원 추가에 실패했습니다.");
    const created = (await res.json()) as WorkerRecord;
    setWorkers((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    );
    setNewName("");
    setWorkerId(created.id);
    showToast("직원을 추가했습니다.");
  }

  async function removeWorker(id: string) {
    const target = workers.find((w) => w.id === id);
    if (!confirm(`${target?.name || "이 직원"}의 근무표를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/workers/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("삭제 실패");
    const remaining = workers.filter((w) => w.id !== id);
    setWorkers(remaining);
    if (workerId === id) {
      skipSave.current = true;
      setWorkerId(remaining[0]?.id ?? null);
      if (!remaining[0]) {
        setName("");
        setHoursByDate({});
        setMemo("");
      }
    }
    showToast("삭제되었습니다.");
  }

  function setDayHours(ymd: string, hours: number) {
    setHoursByDate((prev) => {
      const next = { ...prev };
      if (hours > 0) next[ymd] = hours;
      else delete next[ymd];
      return next;
    });
  }

  const selected = workers.find((w) => w.id === workerId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            Payroll
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">
            직원 급여 산정
          </h1>
          <p className="mt-1 text-sm text-muted">
            대표자 전용 · 직원별 근로시간·주휴수당으로 세전 급여를 계산합니다
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = shiftMonth(year, month, -1);
              setYear(next.year);
              setMonth(next.month);
            }}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm font-semibold"
          >
            이전 달
          </button>
          <p className="min-w-[8.5rem] text-center text-base font-bold tabular-nums">
            {year}년 {month}월
          </p>
          <button
            type="button"
            onClick={() => {
              const next = shiftMonth(year, month, 1);
              setYear(next.year);
              setMonth(next.month);
            }}
            className="h-10 rounded-full border border-line bg-white px-3 text-sm font-semibold"
          >
            다음 달
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-line bg-white p-4 shadow-[0_16px_40px_rgba(16,20,26,0.05)]">
          <p className="text-sm font-bold">직원</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addWorker().catch((err: Error) => showToast(err.message));
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름"
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-3 text-sm outline-none focus:border-teal"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-teal px-3 text-sm font-semibold text-white"
            >
              추가
            </button>
          </form>
          <ul className="mt-3 space-y-1">
            {workers.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setWorkerId(w.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                    w.id === workerId
                      ? "bg-teal-soft font-semibold text-teal"
                      : "text-ink-soft hover:bg-paper"
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  <span className="ml-2 shrink-0 text-[11px] font-medium text-muted">
                    {w.holidayPayEnabled ? "주휴" : "주휴 없음"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!workers.length ? (
            <p className="mt-6 text-center text-sm text-muted">
              직원을 추가하면 월별 근무표를 작성할 수 있습니다.
            </p>
          ) : null}
        </aside>

        <div className="space-y-3">
          {!selected ? (
            <div className="rounded-3xl border border-line bg-white px-4 py-16 text-center text-muted">
              왼쪽에서 직원을 선택하거나 추가하세요.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-white p-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 min-w-[8rem] rounded-2xl border border-line bg-paper px-3 text-base font-bold outline-none focus:border-teal"
                  aria-label="직원 이름"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={holidayPayEnabled}
                    onChange={(e) => setHolidayPayEnabled(e.target.checked)}
                    className="h-4 w-4 accent-teal"
                  />
                  주휴수당 지급
                </label>
                <p className="text-xs text-muted">
                  주 15시간 이상이면 주휴시간 = 주근무시간 ÷ 40 × 8
                </p>
                <button
                  type="button"
                  onClick={() =>
                    removeWorker(selected.id).catch((e: Error) =>
                      showToast(e.message),
                    )
                  }
                  className="ml-auto h-10 rounded-full border border-line px-4 text-sm font-semibold text-[#9b2c2c]"
                >
                  직원 삭제
                </button>
              </div>

              <div className="overflow-auto rounded-3xl border border-line bg-white shadow-[0_16px_40px_rgba(16,20,26,0.05)]">
                <table className="min-w-[920px] w-full border-collapse text-center text-sm">
                  <thead>
                    <tr className="bg-[#eef2f0] text-xs font-bold text-ink-soft">
                      {WEEKDAYS.map((d) => (
                        <th
                          key={d}
                          className="border-b border-line px-1 py-2.5 font-bold"
                        >
                          {d}
                        </th>
                      ))}
                      <th className="border-b border-l border-line px-2 py-2.5">
                        주근무시간
                      </th>
                      <th className="border-b border-line px-2 py-2.5">
                        주휴시간
                      </th>
                      <th className="border-b border-line px-2 py-2.5">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wi) => {
                      const weekTotal = summarizeWeek(
                        week,
                        hoursByDate,
                        holidayPayEnabled,
                      );
                      return (
                        <tr key={wi}>
                          {week.days.map((day) => (
                            <td
                              key={day.ymd}
                              className={`border-b border-line p-1 ${
                                day.inMonth ? "bg-white" : "bg-[#f3f4f6]"
                              }`}
                            >
                              {day.inMonth ? (
                                <label className="block">
                                  <span className="block text-[10px] text-muted">
                                    {day.day}
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    aria-label={`${month}월 ${day.day}일 근로시간`}
                                    value={
                                      drafts[day.ymd] ??
                                      formatHours(hoursByDate[day.ymd] || 0)
                                    }
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [day.ymd]: e.target.value,
                                      }))
                                    }
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={(e) => {
                                      const hours = parseHours(
                                        e.currentTarget.value,
                                      );
                                      setDayHours(day.ymd, hours);
                                      setDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[day.ymd];
                                        return next;
                                      });
                                    }}
                                    className="h-9 w-full rounded-lg bg-transparent text-center tabular-nums outline-none focus:bg-[#fff59d]"
                                  />
                                </label>
                              ) : (
                                <span className="block py-3 text-[10px] text-muted/50">
                                  {day.day}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="border-b border-l border-line bg-[#f8fafc] px-2 font-semibold tabular-nums">
                            {displayHours(weekTotal.workHours)}
                          </td>
                          <td className="border-b border-line bg-[#f8fafc] px-2 tabular-nums">
                            {displayHours(weekTotal.holidayHours)}
                          </td>
                          <td className="border-b border-line bg-[#f8fafc] px-2 font-bold tabular-nums">
                            {displayHours(weekTotal.totalHours)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#eef2f0] font-bold">
                      <td
                        colSpan={7}
                        className="border-b border-line px-3 py-3 text-left"
                      >
                        합계
                      </td>
                      <td className="border-b border-l border-line px-2 tabular-nums">
                        {displayHours(totals.workHours)}
                      </td>
                      <td className="border-b border-line px-2 tabular-nums">
                        {displayHours(totals.holidayHours)}
                      </td>
                      <td className="border-b border-line px-2 tabular-nums">
                        {displayHours(totals.totalHours)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={7}
                        className="border-b border-line px-3 py-3 text-left font-semibold"
                      >
                        적용시급
                      </td>
                      <td
                        colSpan={3}
                        className="border-b border-l border-line bg-[#dbeafe] px-2"
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label="적용시급"
                          defaultValue={money(hourlyWage)}
                          key={`${workerId}-${year}-${month}-${hourlyWage}`}
                          onFocus={(e) => {
                            e.currentTarget.value = String(hourlyWage || "");
                            e.currentTarget.select();
                          }}
                          onBlur={(e) => {
                            const value = parseMoney(e.currentTarget.value);
                            e.currentTarget.value = money(value);
                            setHourlyWage(value);
                          }}
                          className="h-10 w-full bg-transparent text-right font-bold tabular-nums outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-3 text-left font-semibold"
                      >
                        계산 급여(세전)
                      </td>
                      <td className="border-l border-line px-2 py-3 text-right tabular-nums">
                        <p className="text-[10px] font-medium text-muted">
                          기본급
                        </p>
                        {money(totals.workPay)}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">
                        <p className="text-[10px] font-medium text-muted">
                          주휴수당
                        </p>
                        {money(totals.holidayPay)}
                      </td>
                      <td className="bg-[#dbeafe] px-2 py-3 text-right text-base font-extrabold tabular-nums">
                        {money(totals.totalPay)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택)"
                rows={2}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-teal"
              />
              {loading ? (
                <p className="text-sm text-muted">불러오는 중…</p>
              ) : (
                <p className="text-sm text-muted">입력하면 자동 저장됩니다.</p>
              )}
            </>
          )}
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
