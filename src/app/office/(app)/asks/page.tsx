"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  question: string;
  answer: string;
  needsInquiry: boolean;
  approved: string;
  createdAt: string;
};

export default function OfficeAsksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function load() {
    const response = await fetch("/api/office/asks");
    const body = (await response.json()) as { asks?: Row[]; error?: string };
    if (!response.ok) {
      setError(body.error || "질문 목록을 불러오지 못했습니다.");
      setReady(true);
      return;
    }
    const asks = body.asks ?? [];
    setRows(asks);
    setDrafts(Object.fromEntries(asks.map((row) => [row.id, row.approved])));
    setReady(true);
  }

  useEffect(() => {
    load().catch(() => setError("질문 목록을 불러오지 못했습니다."));
  }, []);

  async function onSubmit(event: FormEvent, id: string) {
    event.preventDefault();
    setPending(id);
    setError("");
    const response = await fetch("/api/office/asks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, approved: drafts[id] ?? "" }),
    });
    const body = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(body.error || "답을 저장하지 못했습니다.");
      return;
    }
    await load();
  }

  const approved = rows.filter((row) => row.approved.trim()).length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">AI에게 물어보기</p>
          <h1>고객 질문</h1>
          <p>홈 화면에서 고객이 물은 질문과 그때 보인 답입니다. 이 기록은 다음 질문의 답에 자동으로 반영됩니다. 아래 칸은 틀린 문장을 고칠 때만 쓰면 됩니다.</p>
        </div>
      </header>
      <section className="stats">
        <article className="card stat">
          <span>확인 전</span>
          <strong>{rows.length - approved}</strong>
        </article>
        <article className="card stat">
          <span>다음 답변으로 사용</span>
          <strong>{approved}</strong>
        </article>
        <article className="card stat">
          <span>전체</span>
          <strong>{rows.length}</strong>
        </article>
      </section>
      {error ? <p className="error" style={{ marginTop: 14 }}>{error}</p> : null}
      <div className="stack" style={{ marginTop: 14 }}>
        {!ready && !error ? <p className="help">질문 목록을 불러오는 중입니다.</p> : null}
        {ready && rows.length === 0 && !error ? <p className="help">아직 기록된 질문이 없습니다.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="card">
            <div className="page-head" style={{ marginBottom: 8 }}>
              <div>
                <span className={row.approved.trim() ? "badge completed" : "badge waiting_approval"}>
                  {row.approved.trim() ? "다음 답변으로 사용" : "확인 전"}
                </span>
                <h2 style={{ marginTop: 8 }}>{row.question}</h2>
              </div>
              <p>{new Date(row.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <p className="help">고객에게 보인 답</p>
            <p className="prose">{row.answer}</p>
            <form onSubmit={(event) => onSubmit(event, row.id)} style={{ marginTop: 12 }}>
              <label>
                다음 고객용 답
                <textarea
                  value={drafts[row.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
                  placeholder="다음 고객에게 그대로 보여도 되는 설명만 적습니다. 금액, 월 수량, 다른 고객의 상호·전화번호·매출은 적지 않습니다."
                />
              </label>
              <button className="btn" type="button" style={{ marginTop: 8, marginRight: 8 }} onClick={() => setDrafts((current) => ({ ...current, [row.id]: row.answer }))}>
                보인 답을 초안으로
              </button>
              <button className="btn" type="submit" disabled={pending === row.id} style={{ marginTop: 8 }}>
                {pending === row.id ? "저장 중" : "다음 답변으로 저장"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
