"use client";

import { useState } from "react";
import Link from "next/link";

type Reply = {
  text: string;
  items?: { text: string; href: string }[];
  confirmation?: string;
  followUp?: boolean;
  preview?: { title: string; project: string; assignee: string; dueDate: string };
};

type Turn = Reply & { id: string; speaker: "user" | "assistant" };

export function OperationsAssistant() {
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [followUp, setFollowUp] = useState("");

  function append(speaker: Turn["speaker"], reply: Reply) {
    setTurns(current => [...current, { ...reply, id: crypto.randomUUID(), speaker }]);
  }

  async function send(text: string, confirmation?: string) {
    if (busy || !text.trim()) return;
    append("user", { text });
    setBusy(true);
    if (!confirmation) setPrompt("");
    try {
      const command = (followUp ? followUp + "\n추가 정보: " : "") + text;
      const response = await fetch("/api/os/command", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmation ? { confirmation } : { prompt: command }),
      });
      const reply = await response.json() as Reply;
      setFollowUp(reply.followUp && command.length < 800 ? command : "");
      append("assistant", reply);
    } catch {
      append("assistant", { text: "연결을 확인하고 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-6 md:py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">엠지몬에게 업무 지시</h1>
        <p className="mt-2 text-sm text-muted">ERP의 납기와 지연 업무를 확인하거나 프로젝트에 할 일을 등록합니다.</p>
      </div>
      {turns.length === 0 && (
        <button type="button" onClick={() => send("오늘 납기와 지연된 작업 알려줘")}
          className="w-fit rounded-xl border border-line bg-white px-4 py-2.5 text-left text-sm hover:border-accent">
          오늘 납기와 지연된 작업 알려줘
        </button>
      )}
      <div className="flex flex-col gap-3" aria-live="polite">
        {turns.map(turn => (
          <article key={turn.id} className={turn.speaker === "user" ? "ml-auto max-w-[88%] rounded-2xl bg-ink px-4 py-3 text-white" : "w-full rounded-2xl border border-line bg-white px-4 py-3"}>
            <p className="whitespace-pre-wrap break-words text-sm">{turn.text}</p>
            {turn.items?.length ? <ul className="mt-3 space-y-2 text-sm">{turn.items.map((item, i) => (
              <li key={item.href + i}><Link className="text-accent underline" href={item.href}>{item.text}</Link></li>
            ))}</ul> : null}
            {turn.preview && turn.confirmation && (
              <div className="mt-3 space-y-3 text-sm">
                <p>{turn.preview.title} · {turn.preview.project} · {turn.preview.assignee} · {turn.preview.dueDate || "기한 미정"}</p>
                <button type="button" disabled={busy}
                  className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
                  onClick={() => send("이 할 일 등록", turn.confirmation)}>ERP에 등록</button>
              </div>
            )}
          </article>
        ))}
        {busy && <p className="text-sm text-muted">처리 중…</p>}
      </div>
      <form className="rounded-2xl border border-line bg-white p-4" onSubmit={event => { event.preventDefault(); void send(prompt); }}>
        <label htmlFor="os-command" className="sr-only">ERP 명령</label>
        <textarea id="os-command" rows={3} value={prompt} maxLength={1000} onChange={event => setPrompt(event.target.value)}
          className="w-full resize-y rounded-lg border border-line p-3 text-sm"
          placeholder="예: KSERS 프로젝트에 민지 담당으로 시안 검수를 등록해줘" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted">할 일 명령의 정보를 추출할 때 입력 문장을 OpenAI로 처리합니다.</p>
          <button type="submit" disabled={busy || !prompt.trim()}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">보내기</button>
        </div>
      </form>
    </div>
  );
}
