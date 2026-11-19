"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { monthKey } from "@/lib/calendar";

type Person = { id: string; name: string };
type Item = {
  id: string;
  customerName: string;
  title: string;
  detail: string;
  quantity: number;
  doneCriteria: string;
  month: string;
  driveUrl: string;
  kind: string;
  reason: string;
  status: string;
  startDate: string;
  assigneeName: string;
};

export function InboxBoard() {
  const [items, setItems] = useState<Item[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [canRegister, setCanRegister] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sentence: "",
    customerName: "",
    month: monthKey(),
    driveUrl: "",
    scopeText: "",
  });
  const [assign, setAssign] = useState<Record<string, { assigneeId: string; date: string }>>({});

  async function load() {
    const response = await fetch("/api/os/inbox");
    if (response.status === 403) {
      setError("수신함은 대표와 PM만 엽니다.");
      return;
    }
    if (!response.ok) {
      setError("수신함을 불러오지 못했습니다.");
      return;
    }
    const data = (await response.json()) as {
      me: { canRegister: boolean };
      people: Person[];
      items: Item[];
    };
    setCanRegister(data.me.canRegister);
    setPeople(data.people);
    setItems(data.items);
    setError("");
  }

  useEffect(() => {
    load().catch(() => setError("수신함을 불러오지 못했습니다."));
  }, []);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/os/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "등록하지 못했습니다.");
      return;
    }
    setForm((current) => ({ ...current, sentence: "", scopeText: "" }));
    await load();
  }

  async function assignItem(item: Item) {
    const draft = assign[item.id] ?? { assigneeId: people[0]?.id ?? "", date: "" };
    const response = await fetch(`/api/os/inbox/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "배정하지 못했습니다.");
      return;
    }
    await load();
  }

  const tasks = items.filter((item) => item.kind === "업무");
  const checks = items.filter((item) => item.kind === "확인필요");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">PM 수신함</p>
          <h1 className="text-2xl font-semibold text-ink">문장으로 등록한 업무</h1>
          <p className="mt-1 text-sm text-muted">
            담당자와 날짜를 정하기 전에는 생산 달력에 들어가지 않습니다. 금액은 이 화면에 없습니다.
          </p>
        </div>
        <Link href="/os/ask" className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          AI 질문
        </Link>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {canRegister ? (
        <form onSubmit={register} className="space-y-3 rounded-2xl border border-line bg-white p-4">
          <textarea
            required
            value={form.sentence}
            onChange={(event) => setForm({ ...form, sentence: event.target.value })}
            placeholder="쪽집게천사 블로그, 인스타, 유튜브 월 20건 각각 제작"
            className="min-h-24 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              placeholder="고객사 (문장에 있으면 비워도 됩니다)"
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              required
              type="month"
              value={form.month}
              onChange={(event) => setForm({ ...form, month: event.target.value })}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              value={form.driveUrl}
              onChange={(event) => setForm({ ...form, driveUrl: event.target.value })}
              placeholder="자료 드라이브 주소"
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={form.scopeText}
            onChange={(event) => setForm({ ...form, scopeText: event.target.value })}
            placeholder="계약·기획에 적힌 작업. 비워 두면 문장에 적힌 작업만 수신함에 올라갑니다."
            className="min-h-20 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button disabled={saving} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">
            수신함에 등록
          </button>
        </form>
      ) : (
        <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted">
          대표가 문장으로 등록하면 이 수신함에 도착합니다.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">업무</h2>
        {tasks.length === 0 ? <p className="text-sm text-muted">도착한 업무가 없습니다.</p> : null}
        {tasks.map((item) => {
          const draft = assign[item.id] ?? { assigneeId: people[0]?.id ?? "", date: "" };
          return (
            <article key={item.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">{item.customerName} · {item.title} {item.quantity}건</h3>
                <span className="text-sm text-muted">{item.status === "배정됨" ? `${item.assigneeName} · ${item.startDate}` : "담당자 없음 · 날짜 없음"}</span>
              </div>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div><dt className="text-muted">작업 내용</dt><dd>{item.detail}</dd></div>
                <div><dt className="text-muted">완료 기준</dt><dd>{item.doneCriteria}</dd></div>
                <div><dt className="text-muted">해당 월</dt><dd>{item.month}</dd></div>
                <div><dt className="text-muted">수량</dt><dd>{item.quantity}건</dd></div>
              </dl>
              {item.driveUrl ? <p className="mt-2 text-sm"><a className="text-accent" href={item.driveUrl} target="_blank" rel="noreferrer">자료 열기</a></p> : null}
              {item.status !== "배정됨" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={draft.assigneeId}
                    onChange={(event) => setAssign({ ...assign, [item.id]: { ...draft, assigneeId: event.target.value } })}
                    className="rounded-lg border border-line px-2 py-1 text-sm"
                  >
                    <option value="">생산팀 담당</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => setAssign({ ...assign, [item.id]: { ...draft, date: event.target.value } })}
                    className="rounded-lg border border-line px-2 py-1 text-sm"
                  />
                  <button type="button" onClick={() => assignItem(item)} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white">
                    달력에 배정
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">확인 필요</h2>
        {checks.length === 0 ? <p className="text-sm text-muted">확인이 필요한 항목이 없습니다.</p> : null}
        {checks.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-base font-semibold">{item.customerName} · {item.title}</h3>
            <p className="mt-1 text-sm text-muted">{item.reason}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
