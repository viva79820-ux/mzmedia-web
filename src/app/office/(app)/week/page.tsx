"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Meeting = {
  id: string;
  date: string;
  company: string;
  contact: string;
  title: string;
  service: string;
  stageLabel: string;
  overdue: boolean;
  note: string;
};

type Undated = {
  id: string;
  company: string;
  contact: string;
  title: string;
  service: string;
  stageLabel: string;
};

type WeekData = {
  today: string;
  start: string;
  end: string;
  days: { date: string; label: string; today: boolean }[];
  meetings: Meeting[];
  undated: Undated[];
  undatedCount: number;
  overdueCount: number;
  decisions: {
    contracts: { id: string; company: string; title: string; amountLabel: string }[];
    held: { id: string; company: string; title: string }[];
  };
  exceptions: { id: string; title: string; reason: string; assignee: string; dueDate: string }[];
  exceptionCount: number;
};

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function WeekPage() {
  const [data, setData] = useState<WeekData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function load(start?: string) {
    const query = start ? `?start=${encodeURIComponent(start)}` : "";
    const response = await fetch(`/api/office/week${query}`);
    const body = (await response.json()) as WeekData & { error?: string };
    if (!response.ok) {
      setError(body.error || "일정을 불러오지 못했습니다.");
      return;
    }
    setData(body);
  }

  useEffect(() => {
    load().catch(() => setError("일정을 불러오지 못했습니다."));
  }, []);

  async function schedule(event: FormEvent<HTMLFormElement>, leadId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || "");
    setPendingId(leadId);
    setError("");
    setNotice("");
    const response = await fetch("/api/office/week", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId, date }),
    });
    const body = (await response.json()) as WeekData & { error?: string };
    setPendingId("");
    if (!response.ok) {
      setError(body.error || "일정을 넣지 못했습니다.");
      return;
    }
    setData(body);
    setNotice(`${date} 상담을 일정에 넣었습니다. 고객에게는 알리지 않았습니다.`);
  }

  if (!data) return <p className="help">{error || "이번 주 일정을 불러오는 중입니다."}</p>;

  const meetingCount = data.meetings.filter((item) => !item.overdue).length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">V5 · 대표</p>
          <h1>대표의 일정</h1>
          <p>
            {data.start} – {data.end}. 이번 주 일정은 상담 {meetingCount}건입니다. 막힌 일은 {data.exceptionCount}건으로 한 장에 모았습니다.
            수금과 세금계산서는 회계에 두고, 제작 할일은 직원 업무에 둡니다.
          </p>
        </div>
        <div className="actions">
          <button className="btn-line" type="button" onClick={() => load(addDays(data.start, -7)).catch(() => setError("일정을 불러오지 못했습니다."))}>
            지난 주
          </button>
          <button className="btn-line" type="button" onClick={() => load(addDays(data.start, 7)).catch(() => setError("일정을 불러오지 못했습니다."))}>
            다음 주
          </button>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="help">{notice}</p> : null}
      <section className="week-grid">
        {data.days.map((day) => {
          const items = data.meetings.filter((item) => item.date === day.date);
          return (
            <article key={day.date} className={day.today ? "card day today" : "card day"}>
              <strong>
                {day.label} {day.date.slice(5)}
              </strong>
              {items.length === 0 ? <p className="help">상담 없음</p> : null}
              {items.map((item) => (
                <div key={item.id} className="day-item">
                  <b>{item.company}</b>
                  <p className="help">
                    {item.stageLabel}
                    {item.service ? ` · ${item.service}` : ""}
                    {item.note ? ` · ${item.note}` : ""}
                  </p>
                  {item.overdue ? (
                    <form className="reschedule" onSubmit={(event) => schedule(event, item.id)}>
                      <input type="date" name="date" required />
                      <button className="btn-line" type="submit" disabled={pendingId === item.id}>
                        날짜 변경
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
            </article>
          );
        })}
      </section>
      {data.overdueCount > data.meetings.filter((item) => item.overdue).length ? (
        <p className="help">지난 상담 {data.overdueCount}건 중 오래된 12건만 오늘에 올려 두었습니다.</p>
      ) : null}
      <section className="grid-2">
        <article className="card">
          <h2>날짜를 정할 상담</h2>
          <p className="help">들어온 문의 중 상담일이 없는 것입니다. 날짜만 넣고, 고객에게는 보내지 않습니다.</p>
          {data.undated.length === 0 ? <p className="help">날짜가 비어 있는 상담이 없습니다.</p> : null}
          <div className="stack">
            {data.undated.map((item) => (
              <form key={item.id} className="consult-row" onSubmit={(event) => schedule(event, item.id)}>
                <div>
                  <strong>{item.company}</strong>
                  <p className="help">
                    {item.stageLabel}
                    {item.contact ? ` · ${item.contact}` : ""}
                    {item.service ? ` · ${item.service}` : ""}
                  </p>
                </div>
                <input type="date" name="date" required />
                <button className="btn" type="submit" disabled={pendingId === item.id}>
                  일정에 넣기
                </button>
              </form>
            ))}
          </div>
          {data.undatedCount > data.undated.length ? (
            <p className="help">최근 {data.undated.length}건만 보여 줍니다. 나머지는 리드 화면에 있습니다.</p>
          ) : null}
        </article>
        <div className="stack">
          <article className="card">
            <h2>이번 주 예외</h2>
            <p className="help">막힌 제작만 모았습니다. 진행 중인 할일 전체는 여기 넣지 않습니다.</p>
            {data.exceptions.length === 0 ? <p className="help">막힌 일이 없습니다.</p> : null}
            {data.exceptions.map((item) => (
              <p key={item.id} className="help">
                <strong>{item.reason}</strong> {item.title}
                {item.assignee ? ` · ${item.assignee}` : ""}
                {item.dueDate ? ` · ${item.dueDate}` : ""}
              </p>
            ))}
            {data.exceptionCount > data.exceptions.length ? (
              <p className="help">
                예외 {data.exceptionCount}건 중 {data.exceptions.length}건입니다.{" "}
                <Link href="/office/work">착수·예외</Link>에서 나머지를 봅니다.
              </p>
            ) : null}
          </article>
          <article className="card">
            <h2>대표가 확정할 일</h2>
            <p className="help">계약 체결과 보류된 상담의 방향입니다. 채용도 대표가 합니다. 이 화면은 계약을 바꾸거나 세금계산서를 발행하지 않습니다.</p>
            {data.decisions.contracts.length === 0 ? <p className="help">체결 전 계약 초안이 없습니다.</p> : null}
            {data.decisions.contracts.map((item) => (
              <p key={item.id} className="help">
                <Link href="/os/contracts">{item.company}</Link> · {item.title || "계약 초안"} · {item.amountLabel}
              </p>
            ))}
            {data.decisions.held.map((item) => (
              <p key={item.id} className="help">
                보류 · {item.company} · {item.title}
              </p>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
