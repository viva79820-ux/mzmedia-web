"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/office/StatusBadge";
import { formatWhen } from "@/lib/office/labels";
import type { Job } from "@/lib/office/types";

export default function AgentPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("다음 주 상담용 견적 안내 초안을 정리해 줘. 금액은 확정하지 마.");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const response = await fetch("/api/office/jobs");
    const data = (await response.json()) as { jobs?: Job[]; error?: string };
    if (!response.ok) setError(data.error || "목록을 불러오지 못했습니다.");
    else setJobs(data.jobs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/office/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal, run: true }),
    });
    const data = (await response.json()) as { job?: Job; error?: string };
    setPending(false);
    if (!response.ok || !data.job) {
      setError(data.error || "실행하지 못했습니다.");
      return;
    }
    router.push(`/office/agent/${data.job.id}`);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Master agent</p>
          <h1>마스터 에이전트</h1>
          <p>목표를 적으면 계획, 실행, 평가까지 진행하고 막히면 승인 대기에서 멈춥니다.</p>
        </div>
      </header>
      <section className="grid-2">
        <form className="card stack" onSubmit={onSubmit}>
          <label>
            업무 목표
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} />
          </label>
          <p className="help">발송, 결제, 계약, 운영 서버 변경을 적어도 실행하지 않고 초안만 남깁니다.</p>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" disabled={pending} type="submit">
            {pending ? "계획하고 실행하는 중" : "계획 후 실행"}
          </button>
        </form>
        <article className="card">
          <h2>작업</h2>
          {jobs.length === 0 ? <p className="help">아직 작업이 없습니다.</p> : null}
          <div className="stack">
            {jobs.map((job) => (
              <Link key={job.id} href={`/office/agent/${job.id}`}>
                <StatusBadge status={job.status} paused={job.paused} />
                <strong style={{ display: "block", marginTop: 8 }}>{job.goal}</strong>
                <span className="help">{formatWhen(job.createdAt)}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
