"use client";

import { useEffect, useState } from "react";
import { QUOTE_STATUS_LABEL, formatWon } from "@/lib/os";

type Quote = {
  id: string;
  title: string;
  version: number;
  amount: number;
  status: keyof typeof QUOTE_STATUS_LABEL;
  validUntil: string;
  notes: string;
  customer: { id: string; companyName: string };
  lead?: { id: string; title: string } | null;
  createdBy?: { name: string } | null;
};

type Customer = { id: string; companyName: string };

export function QuotesBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    amount: "",
    validUntil: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    const [qRes, cRes] = await Promise.all([
      fetch("/api/os/quotes"),
      fetch("/api/os/customers"),
    ]);
    if (qRes.ok) setQuotes(((await qRes.json()) as { quotes: Quote[] }).quotes);
    if (cRes.ok) {
      const customers = ((await cRes.json()) as { customers: Customer[] })
        .customers;
      setCustomers(customers);
      if (!form.customerId && customers[0]) {
        setForm((p) => ({ ...p, customerId: customers[0].id }));
      }
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/os/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount) || 0,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "저장 실패");
      return;
    }
    setMessage("견적이 등록되었습니다.");
    setForm((p) => ({ ...p, title: "", amount: "", notes: "" }));
    await load();
  }

  async function newVersion(id: string) {
    await fetch("/api/os/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromQuoteId: id }),
    });
    await load();
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/os/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">견적 관리</h1>
        <p className="mt-1 text-sm text-muted">
          견적 버전을 관리하고 수락 시 계약으로 이어갈 수 있습니다.
        </p>
      </div>

      <form
        onSubmit={createQuote}
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
        <input
          required
          placeholder="견적 제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="금액"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.validUntil}
          onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="비고"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm md:col-span-2"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:w-fit"
        >
          견적 등록
        </button>
        {message && (
          <p className="text-sm text-muted md:col-span-3">{message}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">견적</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">버전</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-line/70">
                <td className="px-3 py-2 font-medium">{q.title}</td>
                <td className="px-3 py-2">{q.customer.companyName}</td>
                <td className="px-3 py-2">{formatWon(q.amount)}</td>
                <td className="px-3 py-2">
                  <select
                    value={q.status}
                    onChange={(e) => setStatus(q.id, e.target.value)}
                    className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                  >
                    {Object.entries(QUOTE_STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">v{q.version}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => newVersion(q.id)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                  >
                    새 버전
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
