"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { productionWeek, seoulDateKey } from "@/lib/calendar";

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
};
type Board = {
  me: { name: string; production: boolean; canAssign: boolean };
  people: Person[];
  slots: Slot[];
};

function SlotLine({ slot }: { slot: Slot }) {
  return (
    <li className="rounded-xl border border-line px-3 py-2 text-sm">
      <p className="font-medium">{slot.customerName} · {slot.title}</p>
      <p className="mt-1 text-muted">{slot.date} · {slot.status}{slot.doneCriteria ? ` · 완료 기준 ${slot.doneCriteria}` : ""}</p>
      <p className="mt-1 flex gap-3">
        {slot.chatHref ? <Link href={slot.chatHref} className="text-accent">대화</Link> : null}
        {slot.driveUrl ? <a href={slot.driveUrl} target="_blank" rel="noreferrer" className="text-accent">자료</a> : null}
      </p>
    </li>
  );
}

export function DayBoard() {
  const search = useSearchParams();
  const today = seoulDateKey();
  const requested = search.get("date") ?? "";
  const [date, setDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");

  const mine = board?.me.production ?? false;
  const days = mine ? productionWeek(today) : [date];

  useEffect(() => {
    const months = [...new Set(days.map((day) => day.slice(0, 7)))];
    Promise.all(months.map((month) => fetch(`/api/os/calendar?month=${month}`).then(async (response) => {
      if (!response.ok) throw new Error("fail");
      return (await response.json()) as Board;
    })))
      .then((pages) => {
        const first = pages[0];
        setBoard({
          me: first.me,
          people: first.people,
          slots: pages.flatMap((page) => page.slots),
        });
        setError("");
      })
      .catch(() => setError("하루 일정을 불러오지 못했습니다."));
    // days is derived from today for production and from date otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, mine]);
  const people = (board?.people ?? []).filter((person) => person.production);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">하루</p>
          <h1 className="text-2xl font-semibold text-ink">{mine ? "오늘과 이번 주" : "날짜별 생산 일정"}</h1>
          <p className="mt-1 text-sm text-muted">
            {board ? board.me.name : "불러오는 중"} · 금액은 이 화면에 없습니다.
          </p>
        </div>
        {mine ? null : (
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm" />
        )}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {mine ? days.map((day) => {
        const slots = (board?.slots ?? []).filter((slot) => slot.date === day);
        return (
          <section key={day} className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base font-semibold">{day}{day === today ? " · 오늘" : ""}</h2>
            {slots.length === 0 ? <p className="mt-2 text-sm text-muted">일정이 없습니다.</p> : (
              <ul className="mt-3 space-y-2">{slots.map((slot) => <SlotLine key={slot.id} slot={slot} />)}</ul>
            )}
          </section>
        );
      }) : people.map((person) => {
        const slots = (board?.slots ?? []).filter((slot) => slot.assigneeId === person.id && slot.date === date);
        return (
          <section key={person.id} className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base font-semibold">{person.name} <span className="text-sm font-normal text-muted">{person.roleLabel}</span></h2>
            {slots.length === 0 ? <p className="mt-2 text-sm text-muted">{date} 일정이 없습니다.</p> : (
              <ul className="mt-3 space-y-2">{slots.map((slot) => <SlotLine key={slot.id} slot={slot} />)}</ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
