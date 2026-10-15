"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Customer = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  memo: string;
  _count: { leads: number; projects: number };
};

export function CustomersBoard() {
  const [items, setItems] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    memo: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/os/customers");
    if (!res.ok) return;
    const data = (await res.json()) as { customers: Customer[] };
    setItems(data.customers);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/os/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "저장 실패");
      return;
    }
    setForm({
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      memo: "",
    });
    setMessage("고객이 등록되었습니다.");
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">고객관리 CRM</h1>
        <p className="mt-1 text-sm text-muted">
          고객별 리드·프로젝트 이력을 한곳에서 관리합니다.
        </p>
      </div>

      <form
        onSubmit={createCustomer}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-2"
      >
        <input
          required
          placeholder="회사명"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="담당자"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="연락처"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="이메일"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <textarea
          placeholder="메모"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm md:col-span-2"
          rows={2}
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            고객 등록
          </button>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">회사</th>
              <th className="px-3 py-2">담당/연락</th>
              <th className="px-3 py-2">리드</th>
              <th className="px-3 py-2">프로젝트</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-3 py-2">
                  <Link
                    href={`/os/customers/${c.id}`}
                    className="font-semibold text-accent"
                  >
                    {c.companyName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {c.contactName}
                  <span className="block text-xs text-muted">
                    {c.phone} {c.email}
                  </span>
                </td>
                <td className="px-3 py-2">{c._count.leads}</td>
                <td className="px-3 py-2">{c._count.projects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
