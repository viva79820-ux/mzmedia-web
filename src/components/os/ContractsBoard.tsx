"use client";

import { useEffect, useState } from "react";
import {
  CONTRACT_STATUS_LABEL,
  SERVICE_CATEGORIES,
  formatWon,
  todayKey,
} from "@/lib/os";

type Contract = {
  id: string;
  title: string;
  contractAmount: number;
  contractDate: string;
  status: keyof typeof CONTRACT_STATUS_LABEL;
  depositAmount: number;
  milestoneAmount: number;
  finalAmount: number;
  documentUrl: string;
  customer: { id: string; companyName: string };
  project?: { id: string; name: string } | null;
  quote?: { id: string; title: string; version: number } | null;
};

type Customer = { id: string; companyName: string };
type Quote = {
  id: string;
  title: string;
  amount: number;
  customer: { id: string };
};

export function ContractsBoard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    quoteId: "",
    title: "",
    contractAmount: "",
    depositAmount: "",
    milestoneAmount: "",
    finalAmount: "",
    contractDate: todayKey(),
    depositDue: "",
    milestoneDue: "",
    finalDue: "",
    documentUrl: "",
    serviceCategory: "기타",
    createProject: true,
  });

  async function load() {
    const [cRes, custRes, qRes] = await Promise.all([
      fetch("/api/os/contracts"),
      fetch("/api/os/customers"),
      fetch("/api/os/quotes"),
    ]);
    if (cRes.ok) {
      setContracts(
        ((await cRes.json()) as { contracts: Contract[] }).contracts,
      );
    }
    if (custRes.ok) {
      const customers = ((await custRes.json()) as { customers: Customer[] })
        .customers;
      setCustomers(customers);
      if (!form.customerId && customers[0]) {
        setForm((p) => ({ ...p, customerId: customers[0].id }));
      }
    }
    if (qRes.ok) {
      setQuotes(((await qRes.json()) as { quotes: Quote[] }).quotes);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createContract(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quoteId: form.quoteId || null,
        contractAmount: Number(form.contractAmount) || 0,
        depositAmount: Number(form.depositAmount) || 0,
        milestoneAmount: Number(form.milestoneAmount) || 0,
        finalAmount:
          form.finalAmount.trim() === ""
            ? undefined
            : Number(form.finalAmount) || 0,
      }),
    });
    setForm((p) => ({
      ...p,
      title: "",
      contractAmount: "",
      depositAmount: "",
      milestoneAmount: "",
      finalAmount: "",
      documentUrl: "",
    }));
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">계약 관리</h1>
        <p className="mt-1 text-sm text-muted">
          계약금·중도금·잔금 일정을 만들고 프로젝트·입금과 연결합니다.
        </p>
      </div>

      <form
        onSubmit={createContract}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
      >
        <select
          required
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
        <select
          value={form.quoteId}
          onChange={(e) => {
            const q = quotes.find((x) => x.id === e.target.value);
            setForm({
              ...form,
              quoteId: e.target.value,
              title: q?.title ?? form.title,
              contractAmount: q ? String(q.amount) : form.contractAmount,
              customerId: q?.customer.id ?? form.customerId,
            });
          }}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="">견적 연결(선택)</option>
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} · {formatWon(q.amount)}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="계약명"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="계약금액"
          value={form.contractAmount}
          onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="계약금"
          value={form.depositAmount}
          onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="중도금"
          value={form.milestoneAmount}
          onChange={(e) =>
            setForm({ ...form, milestoneAmount: e.target.value })
          }
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="잔금(비우면 자동)"
          value={form.finalAmount}
          onChange={(e) => setForm({ ...form, finalAmount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.contractDate}
          onChange={(e) => setForm({ ...form, contractDate: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.serviceCategory}
          onChange={(e) =>
            setForm({ ...form, serviceCategory: e.target.value })
          }
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {SERVICE_CATEGORIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="계약서 URL"
          value={form.documentUrl}
          onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input
            type="checkbox"
            checked={form.createProject}
            onChange={(e) =>
              setForm({ ...form, createProject: e.target.checked })
            }
          />
          계약과 함께 프로젝트·입금일정도 생성
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:w-fit"
        >
          계약 등록
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">계약</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">프로젝트</th>
              <th className="px-3 py-2">문서</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-3 py-2">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted">{c.contractDate}</p>
                </td>
                <td className="px-3 py-2">{c.customer.companyName}</td>
                <td className="px-3 py-2">
                  {formatWon(c.contractAmount)}
                  <span className="block text-xs text-muted">
                    계 {formatWon(c.depositAmount)} / 중{" "}
                    {formatWon(c.milestoneAmount)} / 잔{" "}
                    {formatWon(c.finalAmount)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {CONTRACT_STATUS_LABEL[c.status]}
                </td>
                <td className="px-3 py-2">{c.project?.name ?? "-"}</td>
                <td className="px-3 py-2">
                  {c.documentUrl ? (
                    <a
                      href={c.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent"
                    >
                      열기
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
