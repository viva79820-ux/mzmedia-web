"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type LinkItem = { href: string; label: string };

type Answer = {
  markdown: string;
  links: LinkItem[];
  needsInquiry: boolean;
};

type Turn = {
  id: string;
  question: string;
  answer?: Answer;
};

const samples = [
  "엠지미디어는 어떤 회사야?",
  "엠지미디어의 상품은?",
  "우리 회사는 뷰티샵인데 어떤 광고 패키지를 추천해?",
];

export function HomeChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns]);

  async function ask(text: string) {
    const question = text.trim();
    if (question.length < 2) return;
    setBusy(true);
    setError("");
    const id = `q-${Date.now()}`;
    setTurns((current) => [...current, { id, question }]);
    setMessage("");
    const response = await fetch("/api/home/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: question }),
    });
    const body = (await response.json()) as Answer & { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "대답하지 못했습니다.");
      return;
    }
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, answer: body } : turn)));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(message).catch(() => setError("대답하지 못했습니다."));
  }

  function onQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    ask(message).catch(() => setError("대답하지 못했습니다."));
  }

  const started = turns.length > 0;
  const composer = (
    <form className={started ? "shrink-0 border-t border-line bg-paper" : "w-full"} onSubmit={onSubmit}>
      <div className={`mx-auto w-full max-w-3xl text-left ${started ? "px-4 py-3" : ""}`}>
        <label htmlFor="home-question" className="mb-1 block text-xs font-semibold text-ink-soft">
          새 질문
        </label>
        <div className="flex items-center gap-2">
          <textarea
            id="home-question"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={onQuestionKeyDown}
            rows={2}
            placeholder="우리 업종에 맞는 마케팅을 물어보세요."
            className="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink"
          />
          <button type="submit" disabled={busy} className="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "검색 중" : "검색"}
          </button>
        </div>
      </div>
      {error ? <p className="mx-auto w-full max-w-3xl px-4 pb-3 text-left text-sm text-red-700">{error}</p> : null}
    </form>
  );

  return (
    <section className="flex h-full min-h-0 flex-col">
      {started ? (
        <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {turns.map((turn) => (
              <div key={turn.id} className="flex w-full flex-col gap-3 text-left">
                <article className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-ink">
                  <b className="mb-1 block text-xs text-muted">고객</b>
                  {turn.question}
                </article>
                {turn.answer ? (
                  <article className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink">
                    <b className="mb-1 block text-xs text-muted">엠지미디어</b>
                    <p className="whitespace-pre-wrap">{turn.answer.markdown}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {turn.answer.links.map((link) => (
                        <Link key={link.href} href={link.href} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">
                          {link.label}
                        </Link>
                      ))}
                    {turn.answer.needsInquiry ? (
                      <Link
                        href={`/inquiries?question=${encodeURIComponent(turn.question)}`}
                        className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        1:1 문의
                      </Link>
                    ) : null}
                  </div>
                </article>
                ) : null}
              </div>
            ))}
            <p className="text-center text-xs text-muted">
              <Link href="/inquiries" className="underline">1:1 문의</Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-accent">MZ MEDIA</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">마케팅을 물어보세요</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                회사와 상품은 공개된 안내로 답합니다. 업종과 범위가 구체적인 문의는 근거가 있을 때만 답하고, 없으면 1대1 문의로 받습니다.
              </p>
            </div>
            {composer}
            <div className="flex flex-wrap justify-center gap-2">
              {samples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="rounded-full border border-line bg-white px-3 py-2 text-sm text-ink-soft hover:text-ink"
                  onClick={() => ask(sample).catch(() => setError("대답하지 못했습니다."))}
                >
                  {sample}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              <Link href="/inquiries" className="underline">1:1 문의</Link>
            </p>
          </div>
        </div>
      )}
      {started ? composer : null}
    </section>
  );
}
