"use client";

import { useEffect, useState } from "react";

type Draft = {
  id: string;
  customerName: string;
  kind: string;
  title: string;
  body: string;
  driveUrl: string;
};

export function DraftBoard() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ customerName: "", kind: "제안서", folderUrl: "" });
  const [editing, setEditing] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/os/drafts");
    if (!response.ok) {
      setError("초안을 불러오지 못했습니다.");
      return;
    }
    const data = (await response.json()) as { drafts: Draft[] };
    setDrafts(data.drafts);
    setEditing(Object.fromEntries(data.drafts.map((draft) => [draft.id, draft.body])));
    setError("");
  }

  useEffect(() => {
    load().catch(() => setError("초안을 불러오지 못했습니다."));
  }, []);

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/os/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { error?: string; driveError?: string };
    if (!response.ok) {
      setError(data.error || "초안을 만들지 못했습니다.");
      return;
    }
    setError(data.driveError || "");
    await load();
  }

  async function save(draft: Draft) {
    const response = await fetch(`/api/os/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editing[draft.id] ?? draft.body }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "문장을 저장하지 못했습니다.");
      return;
    }
    setError("");
    await load();
  }

  async function retry(draft: Draft) {
    const response = await fetch(`/api/os/drafts/${draft.id}`, { method: "POST" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "드라이브에 파일을 만들지 못했습니다.");
      return;
    }
    setError("");
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">문서 초안</p>
        <h1 className="text-2xl font-semibold text-ink">제안서 · 계약서 · 기획서</h1>
        <p className="mt-1 text-sm text-muted">
          작업 범위는 오피스 기록에 있는 것만 적습니다. 단가, 견적 합계, 계약금액은 비어 있고 저장되지 않습니다.
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={createDraft} className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4">
        <input
          required
          value={form.customerName}
          onChange={(event) => setForm({ ...form, customerName: event.target.value })}
          placeholder="고객사"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <select
          value={form.kind}
          onChange={(event) => setForm({ ...form, kind: event.target.value })}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option>제안서</option>
          <option>계약서</option>
          <option>기획서</option>
        </select>
        <input
          required
          value={form.folderUrl}
          onChange={(event) => setForm({ ...form, folderUrl: event.target.value })}
          placeholder="고객사 드라이브 폴더 주소"
          className="rounded-lg border border-line px-3 py-2 text-sm md:col-span-2"
        />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white md:col-span-4 md:w-fit">
          초안 만들기
        </button>
      </form>
      {drafts.map((draft) => (
        <article key={draft.id} className="space-y-3 rounded-2xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{draft.title}</h2>
            {draft.driveUrl ? (
              <a className="text-sm text-accent" href={draft.driveUrl} target="_blank" rel="noreferrer">
                드라이브에서 열기
              </a>
            ) : (
              <button type="button" onClick={() => retry(draft)} className="text-sm font-semibold text-accent">
                드라이브에 다시 저장
              </button>
            )}
          </div>
          <textarea
            value={editing[draft.id] ?? draft.body}
            onChange={(event) => setEditing({ ...editing, [draft.id]: event.target.value })}
            className="min-h-48 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => save(draft)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
            문장 저장
          </button>
        </article>
      ))}
    </div>
  );
}
