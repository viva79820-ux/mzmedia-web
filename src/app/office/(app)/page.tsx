"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { MeetingBriefs } from "@/components/office/MeetingBriefs";
import StatusBadge from "@/components/office/StatusBadge";
import { formatUsd, formatWhen } from "@/lib/office/labels";
import type { Job, Policy } from "@/lib/office/types";

type PendingAgent = {
  id: string;
  name: string;
  version: number;
  businessDomain: string;
  allowedTools: string[];
  testResult: string;
  deferredNote: string;
};

function OfficeTalk() {
  const [opener, setOpener] = useState("");
  const [llm, setLlm] = useState(false);
  const [pending, setPending] = useState<PendingAgent[]>([]);
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/office/chat");
    const body = (await response.json()) as { opener?: string; llm?: boolean; pending?: PendingAgent[]; error?: string };
    if (!response.ok) {
      setError(body.error || "대화를 불러오지 못했습니다.");
      return;
    }
    setOpener(body.opener || "");
    setLlm(Boolean(body.llm));
    setPending(body.pending || []);
  }

  useEffect(() => {
    load().catch(() => setError("대화를 불러오지 못했습니다."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/office/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const body = (await response.json()) as { report?: string; pending?: PendingAgent[]; error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "대답하지 못했습니다.");
      return;
    }
    setReply(body.report || "");
    setPending(body.pending || []);
    setMessage("");
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
    setReply(decision === "approve" ? "에이전트를 활성화했습니다. 이제 그 에이전트에게 일을 맡길 수 있습니다." : "에이전트를 활성화하지 않았습니다.");
    await load();
  }

  return (
    <section className="card talk" style={{ marginBottom: 18 }}>
      <img className="agent-face" src="/office/agent.png" alt="엠지 에이전트" />
      <div className="stack">
      <p className="kicker">대화</p>
      <h2>대표 대화</h2>
      <p>{opener || "아침 보고를 불러오는 중입니다."}</p>
      <p className="help">{llm ? "언어 모델이 연결되어 있습니다." : "OPENAI_API_KEY가 없습니다. 새 에이전트는 AI로 만들지 않고, 있는 조회와 지식 검색만 사용합니다."}</p>
      {reply ? <pre className="prose">{reply}</pre> : null}
      {pending.map((agent) => (
        <div key={agent.id}>
          <strong>
            {agent.name} {agent.version}판 · {agent.businessDomain} · 승인 대기
          </strong>
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
        </div>
      ))}
      <form className="stack" onSubmit={onSubmit}>
        <label>
          질문
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="막힌 일을 정리해. 또는 영상 에이전트를 만들어." />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "처리 중" : "말하기"}
        </button>
      </form>
      </div>
    </section>
  );
}

type Summary = {
  mode: "api" | "local";
  limits: { maxSteps: number; maxRuntimeMs: number; maxCostUsd: number };
  counts: { running: number; completed: number; failed: number; approval: number };
  running: Job[];
  recent: Job[];
  usage: { calls: number; tokens: number; costUsd: number };
  policies: Policy[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    async function load() {
      const response = await fetch("/api/office/summary");
      const body = (await response.json()) as Summary & { error?: string };
      if (stop) return;
      if (!response.ok) setError(body.error || "요약을 불러오지 못했습니다.");
      else setData(body);
    }
    load();
    const timer = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);

  if (!data) return <p className="help">{error || "사무실 상태를 불러오는 중입니다."}</p>;

  return (
    <>
      <OfficeTalk />
      <header className="page-head">
        <div>
          <p className="kicker">Dashboard</p>
          <h1>대시보드</h1>
          <p>에이전트는 {data.mode === "api" ? "언어 모델 API" : "비용이 들지 않는 로컬 플래너"}로 계획합니다.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/office/morning">
            아침 보고
          </Link>
          <Link className="btn-line" href="/office/week">
            대표 일정
          </Link>
          <Link className="btn-line" href="/office/package">
            전달 패키지
          </Link>
        </div>
      </header>
      <MeetingBriefs />
      <section className="stats">
        <article className="card stat">
          <span>실행 중</span>
          <strong>{data.counts.running}</strong>
        </article>
        <article className="card stat">
          <span>완료</span>
          <strong>{data.counts.completed}</strong>
        </article>
        <article className="card stat">
          <span>실패</span>
          <strong>{data.counts.failed}</strong>
        </article>
        <article className="card stat">
          <span>승인 대기</span>
          <strong>{data.counts.approval}</strong>
        </article>
      </section>
      <section className="grid-2">
        <article className="card">
          <h2>최근 실행</h2>
          {data.recent.length === 0 ? <p className="help">아직 실행 기록이 없습니다.</p> : null}
          <table>
            <thead>
              <tr>
                <th>목표</th>
                <th>상태</th>
                <th>시각</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link href={`/office/agent/${job.id}`}>{job.goal}</Link>
                  </td>
                  <td>
                    <StatusBadge status={job.status} paused={job.paused} />
                  </td>
                  <td>{formatWhen(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <div className="stack">
          <article className="card">
            <h2>사용량과 비용</h2>
            <p>호출 {data.usage.calls}회</p>
            <p>토큰 {data.usage.tokens.toLocaleString("ko-KR")}</p>
            <p>추정 비용 {formatUsd(data.usage.costUsd)}</p>
            <p className="help">
              한도: 단계 {data.limits.maxSteps}개, 실행 {Math.round(data.limits.maxRuntimeMs / 1000)}초, 작업당 {formatUsd(data.limits.maxCostUsd)}.
              API 키를 넣기 전에는 비용이 0입니다.
            </p>
          </article>
          <article className="card">
            <h2>적용 중인 개선</h2>
            {data.policies.length === 0 ? <p className="help">승인된 개선 규칙이 없습니다.</p> : null}
            {data.policies.map((policy) => (
              <p key={policy.id}>{policy.content}</p>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
