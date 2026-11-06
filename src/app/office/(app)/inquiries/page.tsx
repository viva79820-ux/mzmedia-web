"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  question: string;
  message: string;
  reply: string;
  status: string;
  createdAt: string;
};

export default function OfficeInquiriesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function load() {
    const response = await fetch("/api/office/inquiries");
    const body = (await response.json()) as { inquiries?: Row[]; error?: string };
    if (!response.ok) {
      setError(body.error || "문의 목록을 불러오지 못했습니다.");
      setReady(true);
      return;
    }
    const inquiries = body.inquiries ?? [];
    setRows(inquiries);
    setDrafts(Object.fromEntries(inquiries.map((row) => [row.id, row.reply])));
    setReady(true);
  }

  useEffect(() => {
    load().catch(() => setError("문의 목록을 불러오지 못했습니다."));
  }, []);

  async function onSubmit(event: FormEvent, id: string) {
    event.preventDefault();
    setPending(id);
    setError("");
    const response = await fetch("/api/office/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, reply: drafts[id] ?? "" }),
    });
    const body = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(body.error || "답변을 저장하지 못했습니다.");
      return;
    }
    await load();
  }

  const waiting = rows.filter((row) => row.status === "접수").length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">1:1</p>
          <h1>1:1 문의</h1>
          <p>회원이 남긴 문의입니다. 답변은 그 회원의 마이페이지에 표시되고, 업종이 같은 다음 질문의 설명으로도 쓰입니다.</p>
        </div>
      </header>
      <section className="stats">
        <article className="card stat">
          <span>접수</span>
          <strong>{waiting}</strong>
        </article>
        <article className="card stat">
          <span>답변 완료</span>
          <strong>{rows.length - waiting}</strong>
        </article>
        <article className="card stat">
          <span>전체</span>
          <strong>{rows.length}</strong>
        </article>
      </section>
      {error ? <p className="error" style={{ marginTop: 14 }}>{error}</p> : null}
      <div className="stack" style={{ marginTop: 14 }}>
        {!ready && !error ? <p className="help">문의 목록을 불러오는 중입니다.</p> : null}
        {ready && rows.length === 0 && !error ? <p className="help">아직 접수된 1:1 문의가 없습니다.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="card">
            <div className="page-head" style={{ marginBottom: 8 }}>
              <div>
                <span className={row.status === "답변 완료" ? "badge completed" : "badge waiting_approval"}>{row.status}</span>
                <h2 style={{ marginTop: 8 }}>{row.companyName || "상호 없음"} · {row.contactName}</h2>
                <p>{row.phone} · {row.email}</p>
              </div>
              <p>{new Date(row.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <p className="prose">{row.message}</p>
            <form onSubmit={(event) => onSubmit(event, row.id)} style={{ marginTop: 12 }}>
              <label>
                대표 답변
                <textarea
                  value={drafts[row.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
                  placeholder="다음 고객에게 그대로 보여도 되는 설명만 적습니다. 다른 고객의 상호, 전화번호, 매출은 적지 않습니다."
                />
              </label>
              <button className="btn" type="submit" disabled={pending === row.id} style={{ marginTop: 8 }}>
                {pending === row.id ? "저장 중" : "답변 저장"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
