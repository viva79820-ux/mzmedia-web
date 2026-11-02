"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/office/StatusBadge";
import { ACTIVE_STATUSES, formatUsd, formatWhen } from "@/lib/office/labels";
import type { Approval, Improvement, Job, LogEntry, Step } from "@/lib/office/types";

type Detail = {
  job: Job;
  steps: Step[];
  logs: LogEntry[];
  improvements: Improvement[];
  approvals: Approval[];
  live: boolean;
};

export default function JobPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const response = await fetch(`/api/office/jobs/${params.id}`);
    const body = (await response.json()) as Detail & { error?: string };
    if (!response.ok) setError(body.error || "작업을 불러오지 못했습니다.");
    else setData(body);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    if (!data) return;
    if (!ACTIVE_STATUSES.includes(data.job.status) && !data.live) return;
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [data?.job.status, data?.live, params.id]);

  async function act(action: string, improvementId?: string) {
    setPending(action);
    setError("");
    const response = improvementId
      ? await fetch(`/api/office/improvements/${improvementId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        })
      : await fetch(`/api/office/jobs/${params.id}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });
    const body = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) setError(body.error || "처리하지 못했습니다.");
    await load();
  }

  async function sendFeedback(event: FormEvent) {
    event.preventDefault();
    setPending("feedback");
    const response = await fetch(`/api/office/jobs/${params.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "feedback", title: "대표 피드백", content: feedback }),
    });
    const body = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) setError(body.error || "피드백을 저장하지 못했습니다.");
    else setFeedback("");
  }

  if (!data) return <p className="help">{error || "작업을 불러오는 중입니다."}</p>;
  const waiting = data.improvements.find((item) => item.status === "validated");

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Run</p>
          <h1>{data.job.goal}</h1>
          <p>
            <StatusBadge status={data.job.status} paused={data.job.paused} /> {formatWhen(data.job.createdAt)} · 토큰 {data.job.tokens} · {formatUsd(data.job.costUsd)}
          </p>
        </div>
        <div className="actions">
          {data.job.status === "READY" ? (
            <button className="btn" disabled={!!pending} onClick={() => act("run")}>실행</button>
          ) : null}
          {data.job.status === "RUNNING" && !data.job.paused ? (
            <button className="btn-line" disabled={!!pending} onClick={() => act("pause")}>일시중지</button>
          ) : null}
          {data.job.paused || (data.job.status === "RUNNING" && !data.live) ? (
            <button className="btn" disabled={!!pending} onClick={() => act("resume")}>재개</button>
          ) : null}
          {!["COMPLETED", "FAILED", "CANCELLED"].includes(data.job.status) ? (
            <button className="btn-line danger" disabled={!!pending} onClick={() => act("cancel")}>중단</button>
          ) : null}
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {data.job.error ? <p className="error">{data.job.error}</p> : null}
      <section className="grid-2">
        <div className="stack">
          <article className="card">
            <h2>분석</h2>
            <p>{data.job.analysis || "아직 분석이 없습니다."}</p>
          </article>
          <article className="card">
            <h2>실행 단계</h2>
            <div className="timeline">
              {data.steps.map((step) => (
                <div className={`step ${step.status}`} key={step.id}>
                  <div className="dot">{step.position}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p className="help">{step.tool} · {step.status}{step.log ? ` · ${step.log}` : ""}</p>
                    {step.output?.markdown ? <pre className="prose">{step.output.markdown}</pre> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
          {data.job.report ? (
            <article className="card">
              <h2>완료 보고서</h2>
              <pre className="prose">{data.job.report}</pre>
            </article>
          ) : null}
        </div>
        <div className="stack">
          {waiting ? (
            <article className="card">
              <h2>승인 요청</h2>
              <p>{waiting.problem}</p>
              <p>{waiting.proposal}</p>
              <p className="help">{waiting.validation}</p>
              <div className="actions">
                <button className="btn" disabled={!!pending} onClick={() => act("approve", waiting.id)}>승인 후 다음 실행에 반영</button>
                <button className="btn-line" disabled={!!pending} onClick={() => act("reject", waiting.id)}>거절</button>
              </div>
            </article>
          ) : null}
          <article className="card">
            <h2>실행 로그</h2>
            <div className="log">
              {data.logs.map((log) => (
                <p key={log.id} className={log.level}>
                  {formatWhen(log.createdAt)} {log.message}
                </p>
              ))}
            </div>
          </article>
          <form className="card stack" onSubmit={sendFeedback}>
            <h2>피드백</h2>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="다음에 반영할 점을 적습니다." />
            <button className="btn-line" disabled={!!pending || feedback.trim().length < 4}>기억에 저장</button>
          </form>
        </div>
      </section>
    </>
  );
}
