"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PROJECT_STATUS_LABEL, formatWon } from "@/lib/os";

type Project = {
  id: string;
  name: string;
  status: keyof typeof PROJECT_STATUS_LABEL;
  contractAmount: number;
  dueDate: string;
  progress: number;
  customer: { companyName: string };
  _count: { tasks: number; payments: number };
};

type Customer = { id: string; companyName: string };

export function ProjectsBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    name: "",
    contractAmount: "",
    dueDate: "",
  });

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/os/projects"),
      fetch("/api/os/customers"),
    ]);
    if (pRes.ok) {
      setProjects(((await pRes.json()) as { projects: Project[] }).projects);
    }
    if (cRes.ok) {
      const customers = ((await cRes.json()) as { customers: Customer[] })
        .customers;
      setCustomers(customers);
      if (!form.customerId && customers[0]) {
        setForm((prev) => ({ ...prev, customerId: customers[0].id }));
      }
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contractAmount: Number(form.contractAmount) || 0,
      }),
    });
    setForm((prev) => ({ ...prev, name: "", contractAmount: "", dueDate: "" }));
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">프로젝트 관리</h1>
        <p className="mt-1 text-sm text-muted">
          계약 이후 실행·납품·입금까지 연결되는 단위입니다.
        </p>
      </div>

      <form
        onSubmit={createProject}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4"
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
          placeholder="프로젝트명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="계약금액"
          value={form.contractAmount}
          onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            등록
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">프로젝트</th>
              <th className="px-3 py-2">고객</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">계약금액</th>
              <th className="px-3 py-2">마감</th>
              <th className="px-3 py-2">진행</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-line/70">
                <td className="px-3 py-2">
                  <Link
                    href={`/os/projects/${p.id}`}
                    className="font-semibold text-accent"
                  >
                    {p.name}
                  </Link>
                  <span className="block text-xs text-muted">
                    업무 {p._count.tasks} · 입금 {p._count.payments}
                  </span>
                </td>
                <td className="px-3 py-2">{p.customer.companyName}</td>
                <td className="px-3 py-2">{PROJECT_STATUS_LABEL[p.status]}</td>
                <td className="px-3 py-2">{formatWon(p.contractAmount)}</td>
                <td className="px-3 py-2">{p.dueDate || "-"}</td>
                <td className="px-3 py-2">{p.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
