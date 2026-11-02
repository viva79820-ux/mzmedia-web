"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatWhen } from "@/lib/office/labels";

type Item = {
  id: string;
  companyName: string;
  contactName: string;
  serviceName: string;
  createdAt: string;
  jobId: string | null;
};

export function MeetingBriefs() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/office/briefs");
    const body = (await response.json()) as { items?: Item[]; error?: string };
    if (!response.ok) setError(body.error || "문의를 불러오지 못했습니다.");
    else setItems(body.items || []);
  }

  useEffect(() => {
    load().catch(() => setError("문의를 불러오지 못했습니다."));
  }, []);

  async function openBrief(inquiryId: string) {
    setPending(inquiryId);
    setError("");
    const response = await fetch("/api/office/briefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inquiryId }),
    });
    const body = (await response.json()) as { job?: { id: string }; error?: string };
    setPending("");
    if (!response.ok || !body.job) {
      setError(body.error || "브리프를 만들지 못했습니다.");
      return;
    }
    router.push(`/office/agent/${body.job.id}`);
  }

  return (
    <article className="card">
      <h2>미팅 브리프</h2>
      <p className="help">들어온 견적 문의를 상담용 한 장으로 정리합니다. 고객에게는 보내지 않습니다.</p>
      {error ? <p className="error">{error}</p> : null}
      {items.length === 0 ? <p className="help">아직 접수된 견적 문의가 없습니다.</p> : null}
      <div className="stack">
        {items.map((item) => (
          <div className="actions" key={item.id}>
            <div>
              <strong>{item.companyName}</strong>
              <span className="help">
                {" "}
                {item.contactName} · {item.serviceName} · {formatWhen(item.createdAt)}
              </span>
            </div>
            {item.jobId ? (
              <Link className="btn-line" href={`/office/agent/${item.jobId}`}>
                브리프 보기
              </Link>
            ) : (
              <button className="btn" type="button" disabled={pending === item.id} onClick={() => openBrief(item.id)}>
                {pending === item.id ? "정리 중" : "미팅 브리프"}
              </button>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
