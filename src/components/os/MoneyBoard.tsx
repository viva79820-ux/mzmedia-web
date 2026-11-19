"use client";

import { useEffect, useState } from "react";
import { formatWon } from "@/lib/os";

type CeoRow = {
  id: string;
  customerName: string;
  label: string;
  amount: number;
  dueDate: string;
  paidAt: string;
  status: string;
};

type PmRow = { customerName: string; receivable: string };

export function MoneyBoard() {
  const [amounts, setAmounts] = useState(false);
  const [unpaid, setUnpaid] = useState<CeoRow[]>([]);
  const [overdue, setOverdue] = useState<CeoRow[]>([]);
  const [paid, setPaid] = useState<CeoRow[]>([]);
  const [customers, setCustomers] = useState<PmRow[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/os/money");
    if (response.status === 403) {
      setError("금액 화면을 열 수 없습니다.");
      return;
    }
    if (!response.ok) {
      setError("불러오지 못했습니다.");
      return;
    }
    const data = (await response.json()) as {
      amounts?: boolean;
      unpaid?: CeoRow[];
      overdue?: CeoRow[];
      paidThisMonth?: CeoRow[];
      customers?: PmRow[];
    };
    setAmounts(Boolean(data.amounts));
    setUnpaid(data.unpaid ?? []);
    setOverdue(data.overdue ?? []);
    setPaid(data.paidThisMonth ?? []);
    setCustomers(data.customers ?? []);
    setError("");
  }

  useEffect(() => {
    load().catch(() => setError("불러오지 못했습니다."));
  }, []);

  async function markPaid(id: string) {
    const response = await fetch("/api/os/money", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError("입금 완료는 대표만 저장합니다.");
      return;
    }
    await load();
  }

  function Table({ title, rows, payable }: { title: string; rows: CeoRow[]; payable?: boolean }) {
    return (
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">{title}</h2>
        {rows.length === 0 ? <p className="mt-2 text-sm text-muted">없습니다.</p> : null}
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {row.customerName} · {row.label || "청구"} · {formatWon(row.amount)} · {row.paidAt || row.dueDate || "날짜 없음"}
              </span>
              {payable ? (
                <button type="button" onClick={() => markPaid(row.id)} className="text-xs font-semibold text-accent">
                  입금 완료
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{amounts ? "금액" : "미수 여부"}</h1>
        <p className="mt-1 text-sm text-muted">
          {amounts ? "미수, 예정일이 지난 청구, 이번 달 입금입니다. 입금 완료는 대표만 저장합니다." : "고객사별 미수 있음 또는 미수 없음만 표시합니다."}
        </p>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {amounts ? (
        <>
          <Table title="미수" rows={unpaid} payable />
          <Table title="예정일이 지난 청구" rows={overdue} payable />
          <Table title="이번 달 입금" rows={paid} />
        </>
      ) : (
        <ul className="space-y-2">
          {customers.length === 0 ? <li className="text-sm text-muted">미수 기록이 없습니다.</li> : null}
          {customers.map((row) => (
            <li key={row.customerName} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
              {row.customerName} · {row.receivable}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
