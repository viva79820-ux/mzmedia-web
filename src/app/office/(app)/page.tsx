"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MeetingBriefs } from "@/components/office/MeetingBriefs";
import StatusBadge from "@/components/office/StatusBadge";
import { formatUsd, formatWhen } from "@/lib/office/labels";
import type { Job, Policy } from "@/lib/office/types";

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
      <header className="page-head">
        <div>
          <p className="kicker">Dashboard</p>
          <h1>대시보드</h1>
          <p>에이전트는 {data.mode === "api" ? "언어 모델 API" : "비용이 들지 않는 로컬 플래너"}로 계획합니다.</p>
        </div>
        <Link className="btn" href="/office/package">
          전달 패키지
        </Link>
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
