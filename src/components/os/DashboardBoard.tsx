"use client";

import { useEffect, useState } from "react";
import { formatWon } from "@/lib/os";

type Dash = {
  summary: {
    month: string;
    revenue: number;
    revenueLabel: string;
    monthlyGoal: number;
    monthlyGoalLabel: string;
    goalRate: number;
    newContractAmount: number;
    newContractCount: number;
    expectedIncoming: number;
    overdueAmount: number;
    overdueCount: number;
    pipeline: {
      lead: number;
      consult: number;
      quote: number;
      won: number;
      conversion: number;
    };
    projects: { active: number; delayed: number; delivered: number };
  };
  dueSoonProjects: {
    id: string;
    name: string;
    dueDate: string;
    customer: { companyName: string };
  }[];
  todayTasks: {
    id: string;
    title: string;
    dueDate: string;
    assignee?: { name: string } | null;
  }[];
  nextContacts: {
    id: string;
    title: string;
    nextContactDate: string;
    customer: { companyName: string };
  }[];
  staffCompletion: { id: string; name: string; total: number; done: number; rate: number }[];
};

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function DashboardBoard() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/os/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error("fail");
        setData((await res.json()) as Dash);
      })
      .catch(() => setError("대시보드를 불러오지 못했습니다."));
  }, []);

  if (error) return <p className="text-sm text-accent-deep">{error}</p>;
  if (!data) return <p className="text-sm text-muted">불러오는 중...</p>;

  const s = data.summary;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">대표 대시보드</h1>
        <p className="mt-1 text-sm text-muted">{s.month} 기준 운영 현황</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          label="이번 달 입금(매출)"
          value={s.revenueLabel}
          hint={`목표 ${s.monthlyGoalLabel} · 달성 ${s.goalRate}%`}
        />
        <Card
          label="신규 계약금액"
          value={formatWon(s.newContractAmount)}
          hint={`${s.newContractCount}건`}
        />
        <Card
          label="입금 예정"
          value={formatWon(s.expectedIncoming)}
          hint="이번 달 예정·미수 포함"
        />
        <Card
          label="미수금"
          value={formatWon(s.overdueAmount)}
          hint={`${s.overdueCount}건`}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="신규 리드" value={`${s.pipeline.lead}건`} />
        <Card label="상담 / 견적" value={`${s.pipeline.consult} / ${s.pipeline.quote}`} />
        <Card
          label="계약 전환율"
          value={`${s.pipeline.conversion}%`}
          hint={`계약 ${s.pipeline.won}건`}
        />
        <Card
          label="프로젝트"
          value={`진행 ${s.projects.active}`}
          hint={`지연 ${s.projects.delayed} · 완료 ${s.projects.delivered}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold text-ink">납기 임박·지연</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.dueSoonProjects.length === 0 && (
              <li className="text-muted">해당 없음</li>
            )}
            {data.dueSoonProjects.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {p.name}
                  <span className="block text-xs text-muted">
                    {p.customer.companyName}
                  </span>
                </span>
                <span className="text-xs text-accent-deep">{p.dueDate}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold text-ink">오늘 중요한 업무</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.todayTasks.length === 0 && (
              <li className="text-muted">등록된 업무 없음</li>
            )}
            {data.todayTasks.map((t) => (
              <li key={t.id}>
                {t.title}
                <span className="block text-xs text-muted">
                  {t.assignee?.name ?? "미배정"}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold text-ink">다음 연락 필요 리드</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.nextContacts.length === 0 && (
              <li className="text-muted">해당 없음</li>
            )}
            {data.nextContacts.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span>
                  {l.title}
                  <span className="block text-xs text-muted">
                    {l.customer.companyName}
                  </span>
                </span>
                <span className="text-xs">{l.nextContactDate}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold text-ink">직원별 업무 완료율</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.staffCompletion.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            >
              <p className="font-medium">{s.name}</p>
              <p className="text-muted">
                {s.done}/{s.total} · {s.rate}%
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
