"use client";

import { useState } from "react";

export function AskBoard() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/os/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = (await response.json()) as { answer?: string; evidence?: string[]; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "질문을 처리하지 못했습니다.");
      return;
    }
    setAnswer(data.answer || "기록에 없습니다.");
    setEvidence(data.evidence ?? []);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">업무 질문</p>
        <h1 className="text-2xl font-semibold text-ink">기록으로 답하기</h1>
        <p className="mt-1 text-sm text-muted">
          답은 오피스 기록과 연결된 드라이브 문서에 있는 문장만 사용합니다. 근거가 없으면 기록에 없다고 답합니다.
        </p>
      </div>
      <form onSubmit={ask} className="space-y-3 rounded-2xl border border-line bg-white p-4">
        <textarea
          required
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="쪽집게천사 블로그는 몇 건인가요?"
          className="min-h-24 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button disabled={saving} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">
          묻기
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
      {answer ? (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-base font-semibold">답</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{answer}</p>
          <h3 className="mt-4 text-sm font-semibold">근거</h3>
          {evidence.length === 0 ? (
            <p className="mt-1 text-sm text-muted">기록에 없습니다.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {evidence.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
