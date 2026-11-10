"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { won } from "@/lib/office/money";

type Dash = {
  month: string;
  cash: number | null;
  cashLabel: string;
  confirmedSalesLabel: string;
  actualDepositsLabel: string;
  operatingExpenseLabel: string;
  financeOutflowLabel: string;
  receivableLabel: string;
  overdueCount: number;
  overdueAmount: number;
  confirmedBalanceLabel: string;
  expectedBalanceLabel: string;
  confirmedIn: number;
  expectedIn: number;
  overduePayments: {
    id: string;
    label: string;
    dueDate: string;
    amount: number;
    project: string;
    customer: string;
  }[];
  dueSoon: { id: string; name: string; dueDate: string; customer: { companyName: string } }[];
  overdueProjects: { id: string; name: string; dueDate: string; customer: { companyName: string } }[];
};

export default function ErpDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [cash, setCash] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/office/erp")
      .then(async (response) => {
        const body = (await response.json()) as Dash & { error?: string };
        if (!response.ok) setError(body.error || "대시보드를 불러오지 못했습니다.");
        else {
          setData(body);
          if (body.cash !== null) setCash(String(body.cash));
        }
      })
      .catch(() => setError("대시보드를 불러오지 못했습니다."));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCash(event: React.FormEvent) {
    event.preventDefault();
    const amount = Math.round(Number(cash.replace(/,/g, "")));
    await fetch("/api/office/erp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cash: amount }),
    });
    load();
  }

  if (!data) return <p className="help">{error || "경영 현황을 불러오는 중입니다."}</p>;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">ERP</p>
          <h1>대시보드</h1>
          <p>
            {data.month} 기준입니다. 확정 매출은 이번 달 청구 예정액이고, 입금은 실제로 들어온 금액입니다.
          </p>
        </div>
      </header>
      <section className="stats">
        <article className="card stat">
          <span>이번 달 확정 매출</span>
          <strong>{data.confirmedSalesLabel}</strong>
        </article>
        <article className="card stat">
          <span>이번 달 실제 입금</span>
          <strong>{data.actualDepositsLabel}</strong>
        </article>
        <article className="card stat">
          <span>이번 달 영업지출</span>
          <strong>{data.operatingExpenseLabel}</strong>
          <p className="help">금융지출 {data.financeOutflowLabel}은 빠졌습니다.</p>
        </article>
        <article className="card stat">
          <span>미수금</span>
          <strong>{data.receivableLabel}</strong>
          <p className="help">예정일 경과 {data.overdueCount}건</p>
        </article>
      </section>
      <section className="stats" style={{ marginTop: 14 }}>
        <form className="card stat" onSubmit={saveCash}>
          <span>현재 가용 현금</span>
          <strong>{data.cashLabel}</strong>
          <div className="actions" style={{ marginTop: 10 }}>
            <input value={cash} onChange={(event) => setCash(event.target.value)} placeholder="원 단위" inputMode="numeric" />
            <button className="btn" type="submit">반영</button>
          </div>
        </form>
        <article className="card stat">
          <span>30일 확정 잔액</span>
          <strong>{data.confirmedBalanceLabel}</strong>
          <p className="help">30일 내 미수 {won(data.confirmedIn)}에서 고정비·세금·금융을 뺍니다.</p>
        </article>
        <article className="card stat">
          <span>30일 예상 잔액</span>
          <strong>{data.expectedBalanceLabel}</strong>
          <p className="help">연체 미수까지 포함한 입금 {won(data.expectedIn)}입니다.</p>
        </article>
        <article className="card stat">
          <span>오늘 확인할 사항</span>
          <strong>{data.overdueCount + data.dueSoon.length}</strong>
          <p className="help">수금 지연 {data.overdueCount}건 · 3일 내 납기 {data.dueSoon.length}건</p>
        </article>
      </section>
      <section className="grid-2">
        <article className="card">
          <h2>수금 지연</h2>
          {data.overduePayments.length === 0 ? <p className="help">해당 없음</p> : null}
          {data.overduePayments.map((payment) => (
            <p key={payment.id}>
              {payment.customer} {payment.project} {payment.label || "수금"} · {won(payment.amount)}
              <span className="help"> 예정 {payment.dueDate}</span>
            </p>
          ))}
          <Link className="btn-line" href="/office/erp/payments">수금·미수</Link>
        </article>
        <article className="card">
          <h2>납기</h2>
          {data.overdueProjects.length === 0 && data.dueSoon.length === 0 ? <p className="help">해당 없음</p> : null}
          {data.overdueProjects.map((project) => (
            <p key={project.id}>{project.customer.companyName} {project.name}<span className="help"> 지남 {project.dueDate}</span></p>
          ))}
          {data.dueSoon.map((project) => (
            <p key={project.id}>{project.customer.companyName} {project.name}<span className="help"> {project.dueDate}</span></p>
          ))}
        </article>
      </section>
    </>
  );
}
