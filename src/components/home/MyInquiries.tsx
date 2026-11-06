"use client";

import { FormEvent, useEffect, useState } from "react";

type Row = {
  id: string;
  companyName: string;
  question: string;
  message: string;
  reply: string;
  status: string;
  createdAt: string;
  repliedAt: string;
};

export function MyInquiries({ question }: { question: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState(question);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/home/inquiry");
    const body = (await response.json()) as { inquiries?: Row[]; error?: string };
    if (!response.ok) {
      setError(body.error || "문의 현황을 불러오지 못했습니다.");
      setReady(true);
      return;
    }
    setRows(body.inquiries ?? []);
    setReady(true);
  }

  useEffect(() => {
    load().catch(() => setError("문의 현황을 불러오지 못했습니다."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/home/inquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyName, message, question: question || message }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "문의를 남기지 못했습니다.");
      return;
    }
    setMessage("");
    setCompanyName("");
    await load();
  }

  return (
    <div className="mt-8 grid gap-6">
      <form className="rounded-3xl border border-line bg-white p-5" onSubmit={onSubmit}>
        <h2 className="text-lg font-bold text-ink">새 문의</h2>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">상호</span>
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2"
            placeholder="매장 또는 회사 이름"
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">문의 내용</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2"
            placeholder="업종, 하고 싶은 채널, 궁금한 점을 적어 주세요."
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <button type="submit" disabled={busy} className="mt-4 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "접수 중" : "문의 남기기"}
        </button>
      </form>

      <div className="grid gap-3">
        <h2 className="text-lg font-bold text-ink">문의 현황</h2>
        {!ready ? <p className="text-sm text-muted">문의 현황을 불러오는 중입니다.</p> : null}
        {ready && rows.length === 0 ? <p className="text-sm text-muted">아직 접수한 문의가 없습니다.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-line bg-white p-5 text-sm leading-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b className="text-ink">{row.status}</b>
              <span className="text-xs text-muted">{new Date(row.createdAt).toLocaleString("ko-KR")}</span>
            </div>
            {row.companyName ? <p className="mt-2 text-ink-soft">{row.companyName}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-ink">{row.message}</p>
            {row.reply ? (
              <div className="mt-4 rounded-2xl bg-paper px-4 py-3">
                <b className="text-xs text-muted">대표 답변</b>
                <p className="mt-1 whitespace-pre-wrap text-ink">{row.reply}</p>
              </div>
            ) : (
              <p className="mt-3 text-muted">답변 전입니다.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
