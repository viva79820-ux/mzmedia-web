"use client";

import { useEffect, useState } from "react";
import { COST_CATEGORIES, formatWon, todayKey } from "@/lib/os";

type Cost = {
  id: string;
  label: string;
  category: string;
  amount: number;
  spentAt: string;
  project?: {
    id: string;
    name: string;
    customer: { companyName: string };
  } | null;
};

type Project = { id: string; name: string };

export function CostsBoard() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: "",
    label: "",
    category: "외주비",
    amount: "",
    spentAt: todayKey(),
  });

  async function load() {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/os/costs"),
      fetch("/api/os/projects"),
    ]);
    if (cRes.ok) setCosts(((await cRes.json()) as { costs: Cost[] }).costs);
    if (pRes.ok) {
      setProjects(((await pRes.json()) as { projects: Project[] }).projects);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createCost(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || null,
        amount: Number(form.amount) || 0,
      }),
    });
    setForm((p) => ({ ...p, label: "", amount: "" }));
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("비용을 삭제할까요?")) return;
    await fetch(`/api/os/costs?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">비용 · 원가</h1>
        <p className="mt-1 text-sm text-muted">
          프로젝트 비용을 등록하면 손익 리포트에 반영됩니다.
        </p>
      </div>

      <form
        onSubmit={createCost}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
      >
        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="">프로젝트(선택)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="비용 항목"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {COST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="금액"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.spentAt}
          onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          비용 등록
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">항목</th>
              <th className="px-3 py-2">프로젝트</th>
              <th className="px-3 py-2">분류</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">일자</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {costs.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="px-3 py-2 font-medium">{c.label}</td>
                <td className="px-3 py-2">
                  {c.project?.name ?? "-"}
                  <span className="block text-xs text-muted">
                    {c.project?.customer.companyName}
                  </span>
                </td>
                <td className="px-3 py-2">{c.category}</td>
                <td className="px-3 py-2">{formatWon(c.amount)}</td>
                <td className="px-3 py-2">{c.spentAt || "-"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="text-xs font-semibold text-accent-deep"
                  >
                    삭제
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
