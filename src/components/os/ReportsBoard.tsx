"use client";

import { useEffect, useState } from "react";
import { formatWon, monthPrefix } from "@/lib/os";

type Report = {
  month: string;
  summary: {
    monthRevenueLabel: string;
    newContractAmountLabel: string;
    monthCostLabel: string;
    monthProfitLabel: string;
  };
  revenueByService: { key: string; amount: number }[];
  revenueByChannel: { key: string; label: string; amount: number }[];
  costByCategory: { key: string; amount: number }[];
  leadsBySource: {
    source: string;
    label: string;
    count: number;
    expectedAmount: number;
  }[];
  projectPnl: {
    id: string;
    name: string;
    customer: string;
    contractAmount: number;
    paid: number;
    cost: number;
    profit: number;
    margin: number | null;
  }[];
};

function BarList({
  items,
}: {
  items: { label: string; amount: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <ul className="space-y-2">
      {items.length === 0 && <li className="text-sm text-muted">데이터 없음</li>}
      {items.map((item) => (
        <li key={item.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-2">
            <span>{item.label}</span>
            <span className="font-medium">{formatWon(item.amount)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-paper">
            <div
              className="h-1.5 rounded-full bg-accent"
              style={{ width: `${(item.amount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReportsBoard() {
  const [month, setMonth] = useState(monthPrefix());
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function load(m = month) {
    setError("");
    const res = await fetch(`/api/os/reports?month=${m}`);
    if (!res.ok) {
      setError("리포트를 불러오지 못했습니다.");
      return;
    }
    setData((await res.json()) as Report);
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">경영 리포트</h1>
          <p className="mt-1 text-sm text-muted">
            서비스·채널별 매출과 프로젝트 손익을 확인합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => load(month)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            조회
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-accent-deep">{error}</p>}
      {!data && !error && <p className="text-sm text-muted">불러오는 중...</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["이번 달 입금", data.summary.monthRevenueLabel],
              ["신규 계약", data.summary.newContractAmountLabel],
              ["이번 달 비용", data.summary.monthCostLabel],
              ["예상 이익", data.summary.monthProfitLabel],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-line bg-white p-4">
              <h2 className="mb-3 font-semibold">서비스별 입금</h2>
              <BarList
                items={data.revenueByService.map((x) => ({
                  label: x.key,
                  amount: x.amount,
                }))}
              />
            </section>
            <section className="rounded-2xl border border-line bg-white p-4">
              <h2 className="mb-3 font-semibold">채널별 입금</h2>
              <BarList
                items={data.revenueByChannel.map((x) => ({
                  label: x.label,
                  amount: x.amount,
                }))}
              />
            </section>
            <section className="rounded-2xl border border-line bg-white p-4">
              <h2 className="mb-3 font-semibold">비용 분류</h2>
              <BarList
                items={data.costByCategory.map((x) => ({
                  label: x.key,
                  amount: x.amount,
                }))}
              />
            </section>
          </div>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold">영업채널별 리드</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.leadsBySource.map((row) => (
                <div
                  key={row.source}
                  className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
                >
                  <p className="font-medium">{row.label}</p>
                  <p className="text-muted">
                    {row.count}건 · 예상 {formatWon(row.expectedAmount)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-line bg-white">
            <div className="border-b border-line px-4 py-3 font-semibold">
              프로젝트 손익
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-paper text-xs text-muted">
                <tr>
                  <th className="px-3 py-2">프로젝트</th>
                  <th className="px-3 py-2">계약</th>
                  <th className="px-3 py-2">입금</th>
                  <th className="px-3 py-2">비용</th>
                  <th className="px-3 py-2">이익</th>
                  <th className="px-3 py-2">이익률</th>
                </tr>
              </thead>
              <tbody>
                {data.projectPnl.map((p) => (
                  <tr key={p.id} className="border-t border-line/70">
                    <td className="px-3 py-2">
                      {p.name}
                      <span className="block text-xs text-muted">
                        {p.customer}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatWon(p.contractAmount)}</td>
                    <td className="px-3 py-2">{formatWon(p.paid)}</td>
                    <td className="px-3 py-2">{formatWon(p.cost)}</td>
                    <td className="px-3 py-2">{formatWon(p.profit)}</td>
                    <td className="px-3 py-2">
                      {p.margin === null ? "-" : `${p.margin}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
