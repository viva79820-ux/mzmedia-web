"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SLOT_STATUSES, monthGrid, monthKey, seoulDateKey, shiftMonth, weekdaysOfWeek } from "@/lib/calendar";

type Person = { id: string; name: string; roleLabel: string; production?: boolean };
type Slot = {
  id: string;
  customerName: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  date: string;
  status: string;
  doneCriteria?: string;
  driveUrl?: string;
  chatHref?: string;
  mine: boolean;
};
type Board = {
  month: string;
  me: { id: string; name: string; roleLabel: string; canAssign: boolean; production: boolean };
  people: Person[];
  slots: Slot[];
  counts: Array<{ customerName: string; count: number }>;
};

const WEEKDAYS = ["월", "화", "수", "목", "금"];
const TODAY = seoulDateKey();

export function CalendarBoard() {
  const search = useSearchParams();
  const initialMonth = /^\d{4}-\d{2}$/.test(search.get("month") ?? "")
    ? search.get("month")!
    : monthKey();
  const [month, setMonth] = useState(initialMonth);
  const [board, setBoard] = useState<Board | null>(null);
  const [personId, setPersonId] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    title: "",
    date: "",
    quantity: "1",
    assigneeId: "",
  });

  async function load(nextMonth = month) {
    const response = await fetch(`/api/os/calendar?month=${nextMonth}`);
    if (!response.ok) {
      setError("달력을 불러오지 못했습니다.");
      return;
    }
    const data = (await response.json()) as Board;
    setBoard(data);
    setError("");
    if (!form.assigneeId && data.people[0]) {
      setForm((current) => ({ ...current, assigneeId: data.me.production ? data.me.id : data.people[0].id }));
    }
  }

  useEffect(() => {
    load(month).catch(() => setError("달력을 불러오지 못했습니다."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const visiblePeople = useMemo(() => {
    if (!board) return [];
    if (board.me.production || personId === "all") return board.people;
    return board.people.filter((person) => person.id === personId);
  }, [board, personId]);

  const daySlots = board?.slots.filter((slot) => slot.date === selectedDate && visiblePeople.some((person) => person.id === slot.assigneeId)) ?? [];
  const counts = useMemo(() => {
    const ids = new Set(visiblePeople.map((person) => person.id));
    const map = new Map<string, number>();
    for (const slot of board?.slots ?? []) {
      if (!ids.has(slot.assigneeId)) continue;
      map.set(slot.customerName, (map.get(slot.customerName) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([customerName, count]) => ({ customerName, count }))
      .sort((a, b) => b.count - a.count || a.customerName.localeCompare(b.customerName, "ko"));
  }, [board, visiblePeople]);

  function canEdit(slot: Slot) {
    if (!board) return false;
    return board.me.canAssign || slot.mine;
  }

  async function createSlot(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/os/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        title: form.title,
        date: form.date,
        quantity: Number(form.quantity || 1),
        assigneeId: board?.me.canAssign ? form.assigneeId : board?.me.id,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "배정하지 못했습니다.");
      return;
    }
    const targetMonth = form.date.slice(0, 7);
    setForm((current) => ({ ...current, customerName: "", title: "", quantity: "1" }));
    if (targetMonth && targetMonth !== month) setMonth(targetMonth);
    else await load();
  }

  async function updateSlot(slot: Slot, patch: Record<string, string>) {
    const response = await fetch(`/api/os/calendar/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "수정하지 못했습니다.");
      return;
    }
    await load();
  }

  async function removeSlot(slot: Slot) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    const response = await fetch(`/api/os/calendar/${slot.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("삭제하지 못했습니다.");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">생산 일정</p>
          <h1 className="text-2xl font-semibold text-ink">
            {board?.me.production ? "내 달력" : "팀 달력"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {board ? `${board.me.name} · ${board.me.roleLabel}` : "불러오는 중"} · 주말은 접혀 있습니다. 금액은 이 화면에 없습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/os/ask" className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
            AI 질문
          </Link>
          <button type="button" className="rounded-lg border border-line bg-white px-3 py-2 text-sm" onClick={() => setMonth(shiftMonth(month, -1))}>
            이전달
          </button>
          <strong className="min-w-24 text-center">{month}</strong>
          <button type="button" className="rounded-lg border border-line bg-white px-3 py-2 text-sm" onClick={() => setMonth(shiftMonth(month, 1))}>
            다음달
          </button>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {board && !board.me.production ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPersonId("all")} className={`rounded-full px-3 py-1 text-sm ${personId === "all" ? "bg-accent text-white" : "bg-white border border-line"}`}>
            전체
          </button>
          {board.people.map((person) => (
            <button key={person.id} type="button" onClick={() => setPersonId(person.id)} className={`rounded-full px-3 py-1 text-sm ${personId === person.id ? "bg-accent text-white" : "bg-white border border-line"}`}>
              {person.name}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={createSlot} className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-6">
        <input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} placeholder="고객사" className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="작업명" className="rounded-lg border border-line px-3 py-2 text-sm md:col-span-2" />
        <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="rounded-lg border border-line px-3 py-2 text-sm" />
        <input required type="number" min={1} max={60} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className="rounded-lg border border-line px-3 py-2 text-sm" aria-label="건수" />
        {board?.me.canAssign ? (
          <select value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })} className="rounded-lg border border-line px-3 py-2 text-sm">
            {board.people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        ) : (
          <p className="self-center text-sm text-muted">내 일정만 추가됩니다.</p>
        )}
        <button disabled={saving} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white md:col-span-6">
          {board?.me.canAssign ? "배정" : "내 일정 추가"}
        </button>
      </form>

      {board?.me.production && month === TODAY.slice(0, 7) ? (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-base font-semibold">이번 주</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {weekdaysOfWeek(TODAY).map((iso) => {
              const items = board.slots.filter((slot) => slot.date === iso);
              return (
                <button key={iso} type="button" onClick={() => setSelectedDate(iso)} className={`rounded-xl border px-2 py-2 text-left ${iso === TODAY ? "border-accent" : "border-line"}`}>
                  <span className="text-xs text-muted">{iso.slice(5)}{iso === TODAY ? " · 오늘" : ""}</span>
                  {items.length === 0 ? <p className="mt-1 text-sm text-muted">없음</p> : items.map((item) => (
                    <p key={item.id} className="mt-1 text-sm">{item.customerName} {item.title}</p>
                  ))}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {visiblePeople.map((person) => (
        <section key={person.id} className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">{person.name} <span className="text-sm font-normal text-muted">{person.roleLabel}</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
              <thead>
                <tr>
                  {WEEKDAYS.map((label) => (
                    <th key={label} className="border-b border-line px-2 py-2 text-xs text-muted">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(month).map((week, index) => (
                  <tr key={index}>
                    {week.map((iso, cell) => {
                      const items = board?.slots.filter((slot) => slot.assigneeId === person.id && slot.date === iso) ?? [];
                      return (
                        <td key={`${index}-${cell}`} className="h-28 border-b border-line px-1 py-1 align-top">
                          {iso ? (
                            <button type="button" onClick={() => { setSelectedDate(iso); setForm((current) => ({ ...current, date: iso, assigneeId: person.id })); }} className="w-full text-left">
                              <span className={`text-xs ${selectedDate === iso ? "font-semibold text-accent" : "text-muted"}`}>{Number(iso.slice(8))}</span>
                              <div className="mt-1 space-y-1">
                                {items.map((item) => (
                                  <p key={item.id} className="truncate rounded bg-accent/10 px-1 py-0.5 text-[11px] text-ink">
                                    {item.customerName} {item.title}
                                  </p>
                                ))}
                              </div>
                            </button>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="text-base font-semibold">고객사별 건수</h2>
        {!board ? null : counts.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {counts.map((row) => (
              <li key={row.customerName} className="rounded-full bg-paper px-3 py-1 text-sm">{row.customerName} {row.count}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">이번 달 일정이 없습니다.</p>
        )}
      </section>

      {selectedDate ? (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-base font-semibold">{selectedDate} 일정</h2>
          <div className="mt-3 space-y-3">
            {daySlots.length === 0 ? <p className="text-sm text-muted">이 날의 일정이 없습니다.</p> : null}
            {daySlots.map((slot) => (
              <div key={slot.id} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-6">
                <div className="text-sm md:col-span-2">
                  <p><strong>{slot.customerName}</strong> {slot.title}</p>
                  {slot.doneCriteria ? <p className="text-muted">완료 기준 {slot.doneCriteria}</p> : null}
                  <p className="mt-1 flex gap-3">
                    {slot.chatHref ? <Link href={slot.chatHref} className="text-accent">대화</Link> : null}
                    {slot.driveUrl ? <a href={slot.driveUrl} target="_blank" rel="noreferrer" className="text-accent">자료</a> : null}
                  </p>
                </div>
                <p className="text-sm text-muted">{slot.assigneeName}</p>
                {canEdit(slot) ? (
                  <>
                    <select value={slot.status} onChange={(event) => updateSlot(slot, { status: event.target.value })} className="rounded-lg border border-line px-2 py-1 text-sm">
                      {SLOT_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <input type="date" defaultValue={slot.date} onBlur={(event) => { if (event.target.value && event.target.value !== slot.date) updateSlot(slot, { date: event.target.value }); }} className="rounded-lg border border-line px-2 py-1 text-sm" />
                    <button type="button" onClick={() => removeSlot(slot)} className="text-sm text-red-700">삭제</button>
                  </>
                ) : (
                  <p className="text-sm">{slot.status}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
