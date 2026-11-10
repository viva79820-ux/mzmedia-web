"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type PendingAgent = {
  id: string;
  name: string;
  version: number;
  businessDomain: string;
  allowedTools: string[];
  testResult: string;
  deferredNote: string;
};

type Turn = {
  id: string;
  goal: string;
  report: string;
  status: string;
  createdAt: string;
  ledger: { summary: string } | null;
};

export default function MzmonPage() {
  const [opener, setOpener] = useState("");
  const [llm, setLlm] = useState(false);
  const [pending, setPending] = useState<PendingAgent[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  async function load() {
    const response = await fetch("/api/office/chat");
    const body = (await response.json()) as { opener?: string; llm?: boolean; pending?: PendingAgent[]; turns?: Turn[]; error?: string };
    if (!response.ok) {
      setError(body.error || "대화를 불러오지 못했습니다.");
      return;
    }
    setOpener(body.opener || "");
    setLlm(Boolean(body.llm));
    setPending(body.pending || []);
    setTurns(body.turns || []);
  }

  useEffect(() => {
    load().catch(() => setError("대화를 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns, opener, pending]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/office/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "대답하지 못했습니다.");
      return;
    }
    setMessage("");
    await load();
  }

  async function fileLedger(id: string, decision: "commit" | "hold") {
    setBusy(true);
    setError("");
    const response = await fetch("/api/office/ledger", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: id, decision }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "장부에 넣지 못했습니다.");
      return;
    }
    await load();
  }

  async function decide(id: string, decision: "approve" | "reject") {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/office/agents/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "승인 처리에 실패했습니다.");
      return;
    }
    await load();
  }

  const ordered = [...turns].reverse();

  return (
    <section className="mzmon">
      <header className="mzmon-head">
        <img className="agent-face" src="/office/agent.png" alt="엠지 에이전트" />
        <div>
          <p className="kicker">MZMON</p>
          <h1>엠지몬</h1>
          <p className="help">{llm ? "언어 모델이 연결되어 있습니다." : "언어 모델 키가 없습니다. 초안과 조회는 양식으로 답합니다."}</p>
        </div>
      </header>
      <div className="thread" ref={threadRef}>
        <article className="bubble agent">
          <b>엠지몬</b>
          <p>{opener || "아침 현황을 불러오는 중입니다."}</p>
        </article>
        {ordered.map((turn) => (
          <div key={turn.id} className="turn">
            <article className="bubble user">
              <b>대표</b>
              <p>{turn.goal}</p>
            </article>
            {turn.report ? (
              <article className="bubble agent">
                <b>엠지몬</b>
                <pre className="prose">{turn.report}</pre>
                {turn.ledger && turn.status === "WAITING_APPROVAL" ? (
                  <div className="actions">
                    <button className="btn" type="button" disabled={busy} onClick={() => fileLedger(turn.id, "commit").catch(() => setError("장부에 넣지 못했습니다."))}>
                      장부에 넣기
                    </button>
                    <button className="btn-line" type="button" disabled={busy} onClick={() => fileLedger(turn.id, "hold").catch(() => setError("장부에 넣지 못했습니다."))}>
                      넣지 않기
                    </button>
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        ))}
        {pending.map((agent) => (
          <article key={agent.id} className="bubble agent">
            <b>
              {agent.name} {agent.version}판 · 승인 대기
            </b>
            <p className="help">도구: {agent.allowedTools.join(", ")}</p>
            {agent.deferredNote ? <p className="help">{agent.deferredNote}</p> : null}
            <p className="help">{agent.testResult}</p>
            <div className="actions">
              <button className="btn" type="button" disabled={busy} onClick={() => decide(agent.id, "approve").catch(() => setError("승인 처리에 실패했습니다."))}>
                승인
              </button>
              <button className="btn-line" type="button" disabled={busy} onClick={() => decide(agent.id, "reject").catch(() => setError("승인 처리에 실패했습니다."))}>
                거절
              </button>
            </div>
          </article>
        ))}
      </div>
      <form className="composer" onSubmit={onSubmit}>
        <label htmlFor="mzmon-question">새 질문</label>
        {error ? <p className="error">{error}</p> : null}
        <div className="composer-row">
          <textarea
            id="mzmon-question"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="한빛식품 잔금 150만 오늘 입금"
            rows={2}
          />
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "처리 중" : "말하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
