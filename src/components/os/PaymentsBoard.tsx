"use client";

import { useEffect, useState } from "react";
import {
  PAYMENT_KIND_LABEL,
  PAYMENT_STATUS_LABEL,
  formatWon,
  todayKey,
} from "@/lib/os";

type Payment = {
  id: string;
  label: string;
  kind: keyof typeof PAYMENT_KIND_LABEL;
  amount: number;
  dueDate: string;
  paidAt: string;
  status: keyof typeof PAYMENT_STATUS_LABEL;
  project?: {
    name: string;
    customer: { companyName: string };
  } | null;
};

type Project = { id: string; name: string };

export function PaymentsBoard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: "",
    label: "",
    kind: "DEPOSIT",
    amount: "",
    dueDate: todayKey(),
  });

  async function load() {
    const [payRes, projRes] = await Promise.all([
      fetch("/api/os/payments"),
      fetch("/api/os/projects"),
    ]);
    if (payRes.ok) {
      setPayments(((await payRes.json()) as { payments: Payment[] }).payments);
    }
    if (projRes.ok) {
      setProjects(((await projRes.json()) as { projects: Project[] }).projects);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || null,
        amount: Number(form.amount) || 0,
      }),
    });
    setForm((prev) => ({ ...prev, label: "", amount: "" }));
    await load();
  }

  async function markPaid(id: string) {
    await fetch("/api/os/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "PAID", paidAt: todayKey() }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">매출 · 입금관리</h1>
        <p className="mt-1 text-sm text-muted">
          계약금/중도금/잔금 일정을 등록하고 미수를 추적합니다.
        </p>
      </div>

      <form
        onSubmit={createPayment}
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
          placeholder="항목명"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {Object.entries(PAYMENT_KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
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
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          입금 일정 등록
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">항목</th>
              <th className="px-3 py-2">프로젝트</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">예정일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-line/70">
                <td className="px-3 py-2">
                  {p.label || PAYMENT_KIND_LABEL[p.kind]}
                  <span className="block text-xs text-muted">
                    {PAYMENT_KIND_LABEL[p.kind]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {p.project?.name ?? "-"}
                  <span className="block text-xs text-muted">
                    {p.project?.customer.companyName}
                  </span>
                </td>
                <td className="px-3 py-2">{formatWon(p.amount)}</td>
                <td className="px-3 py-2">{p.dueDate || "-"}</td>
                <td className="px-3 py-2">{PAYMENT_STATUS_LABEL[p.status]}</td>
                <td className="px-3 py-2">
                  {p.status !== "PAID" && (
                    <button
                      type="button"
                      onClick={() => markPaid(p.id)}
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                    >
                      입금완료
                    </button>
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
