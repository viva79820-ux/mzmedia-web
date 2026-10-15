"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LEAD_SOURCE_LABEL,
  LEAD_STAGE_LABEL,
  formatWon,
} from "@/lib/os";

type Lead = {
  id: string;
  title: string;
  stage: keyof typeof LEAD_STAGE_LABEL;
  source: keyof typeof LEAD_SOURCE_LABEL;
  expectedAmount: number | null;
  nextContactDate: string;
  desiredService: string;
  customer: { id: string; companyName: string; contactName: string; phone: string };
  owner?: { name: string } | null;
};

type Customer = { id: string; companyName: string };

const STAGES = Object.keys(LEAD_STAGE_LABEL) as (keyof typeof LEAD_STAGE_LABEL)[];

export function LeadsBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    title: "",
    source: "OTHER",
    desiredService: "",
    expectedAmount: "",
  });
  const [message, setMessage] = useState("");

  async function load() {
    const [leadRes, custRes] = await Promise.all([
      fetch("/api/os/leads"),
      fetch("/api/os/customers"),
    ]);
    if (leadRes.ok) {
      const data = (await leadRes.json()) as { leads: Lead[] };
      setLeads(data.leads);
    }
    if (custRes.ok) {
      const data = (await custRes.json()) as { customers: Customer[] };
      setCustomers(data.customers);
      if (!form.customerId && data.customers[0]) {
        setForm((prev) => ({ ...prev, customerId: data.customers[0].id }));
      }
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s, [] as Lead[]])) as Record<
      string,
      Lead[]
    >;
    for (const lead of leads) {
      (map[lead.stage] ?? map.LEAD).push(lead);
    }
    return map;
  }, [leads]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/os/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expectedAmount:
          form.expectedAmount.trim() === ""
            ? null
            : Number(form.expectedAmount),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "저장 실패");
      return;
    }
    setMessage("리드가 등록되었습니다.");
    setForm((prev) => ({
      ...prev,
      title: "",
      desiredService: "",
      expectedAmount: "",
    }));
    await load();
  }

  async function moveStage(id: string, stage: string) {
    await fetch(`/api/os/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        convertToProject: stage === "WON",
      }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">영업 Pipeline</h1>
        <p className="mt-1 text-sm text-muted">
          홈페이지 문의는 자동으로 리드로 들어옵니다. 계약완료 시 프로젝트로
          전환됩니다.
        </p>
      </div>

      <form
        onSubmit={createLead}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
      >
        <select
          required
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          <option value="">고객 선택</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="리드 제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {Object.entries(LEAD_SOURCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          placeholder="희망 서비스"
          value={form.desiredService}
          onChange={(e) => setForm({ ...form, desiredService: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="예상 계약금액"
          value={form.expectedAmount}
          onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          리드 등록
        </button>
        {message && (
          <p className="text-sm text-muted md:col-span-3">{message}</p>
        )}
      </form>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="w-72 shrink-0 rounded-2xl border border-line bg-white"
          >
            <div className="border-b border-line px-3 py-2 text-sm font-semibold">
              {LEAD_STAGE_LABEL[stage]}{" "}
              <span className="text-muted">({grouped[stage].length})</span>
            </div>
            <div className="space-y-2 p-2">
              {grouped[stage].map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-xl border border-line bg-paper p-3 text-sm"
                >
                  <p className="font-semibold text-ink">{lead.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {lead.customer.companyName} ·{" "}
                    {LEAD_SOURCE_LABEL[lead.source]}
                  </p>
                  <p className="mt-1 text-xs">
                    {formatWon(lead.expectedAmount)} ·{" "}
                    {lead.owner?.name ?? "미배정"}
                  </p>
                  <select
                    className="mt-2 w-full rounded-lg border border-line bg-white px-2 py-1 text-xs"
                    value={lead.stage}
                    onChange={(e) => moveStage(lead.id, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STAGE_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
