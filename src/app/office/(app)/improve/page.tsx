"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatWhen } from "@/lib/office/labels";
import type { Improvement, Policy } from "@/lib/office/types";

const STATUS_TEXT = {
  proposed: "제안",
  validated: "검증 통과 · 승인 대기",
  applied: "적용됨",
  rejected: "거절",
};

export default function ImprovePage() {
  const [items, setItems] = useState<Improvement[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function load() {
    const response = await fetch("/api/office/improvements");
    const data = (await response.json()) as { items?: Improvement[]; policies?: Policy[]; error?: string };
    if (!response.ok) setError(data.error || "개선안을 불러오지 못했습니다.");
    else {
      setItems(data.items || []);
      setPolicies(data.policies || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    setPending(id + action);
    const response = await fetch(`/api/office/improvements/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) setError(data.error || "처리하지 못했습니다.");
    await load();
  }

  const waiting = items.filter((item) => item.status === "validated");
  const history = items.filter((item) => item.status !== "validated");

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Improvement</p>
          <h1>자기개선</h1>
          <p>검증을 통과한 제안만 승인할 수 있고, 승인분은 다음 실행의 규칙이 됩니다.</p>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <section className="stack">
        {waiting.length === 0 ? <article className="card"><p className="help">승인 대기 중인 개선안이 없습니다.</p></article> : null}
        {waiting.map((item) => (
          <article className="card" key={item.id}>
            <p className="badge waiting_approval">{STATUS_TEXT[item.status]}</p>
            <h2>{item.problem}</h2>
            <p>{item.proposal}</p>
            <p className="help">검증 결과: {item.validation}</p>
            <div className="actions">
              <button className="btn" disabled={!!pending} onClick={() => decide(item.id, "approve")}>승인</button>
              <button className="btn-line" disabled={!!pending} onClick={() => decide(item.id, "reject")}>거절</button>
              {item.jobId ? <Link className="btn-line" href={`/office/agent/${item.jobId}`}>작업 보기</Link> : null}
            </div>
          </article>
        ))}
        <article className="card">
          <h2>적용 이력</h2>
          {policies.length === 0 ? <p className="help">적용된 규칙이 없습니다.</p> : null}
          {policies.map((policy) => (
            <p key={policy.id}>{formatWhen(policy.createdAt)} · {policy.content}</p>
          ))}
        </article>
        <article className="card">
          <h2>제안 이력</h2>
          <table>
            <thead>
              <tr><th>문제</th><th>상태</th><th>검증</th></tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.problem}</td>
                  <td>{STATUS_TEXT[item.status]}</td>
                  <td>{item.validation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </>
  );
}
