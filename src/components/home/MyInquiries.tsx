"use client";

import { useEffect, useState } from "react";

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

export function MyInquiries() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="mt-8 grid gap-3">
      <h2 className="text-lg font-bold text-ink">문의 현황</h2>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
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
  );
}
