"use client";

import { useEffect, useState } from "react";
import { CADENCE_LABEL } from "@/lib/os";

type Instance = {
  id: string;
  periodKey: string;
  kpiTarget: number;
  kpiDone: number;
  status: string;
};

type Template = {
  id: string;
  title: string;
  description: string;
  cadence: keyof typeof CADENCE_LABEL;
  kpiTarget: number;
  active: boolean;
  assignee?: { name: string } | null;
  instances: Instance[];
};

export function RecurringBoard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({
    title: "",
    cadence: "DAILY",
    kpiTarget: "5",
    description: "",
  });

  async function load() {
    const res = await fetch("/api/os/recurring");
    if (!res.ok) return;
    setTemplates(((await res.json()) as { templates: Template[] }).templates);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/os/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        kpiTarget: Number(form.kpiTarget) || 1,
      }),
    });
    setForm({ title: "", cadence: "DAILY", kpiTarget: "5", description: "" });
    await load();
  }

  async function bump(instance: Instance, delta: number) {
    const kpiDone = Math.max(0, instance.kpiDone + delta);
    const status =
      kpiDone >= instance.kpiTarget ? "DONE" : kpiDone > 0 ? "IN_PROGRESS" : "TODO";
    await fetch("/api/os/recurring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId: instance.id, kpiDone, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">반복업무 · KPI</h1>
        <p className="mt-1 text-sm text-muted">
          매일/매주/매월 업무가 자동 생성되고 목표 대비 달성률을 기록합니다.
        </p>
      </div>

      <form
        onSubmit={createTemplate}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4"
      >
        <input
          required
          placeholder="반복업무명 (예: 영업 발굴)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm md:col-span-2"
        />
        <select
          value={form.cadence}
          onChange={(e) => setForm({ ...form, cadence: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {Object.entries(CADENCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          placeholder="목표 건수"
          value={form.kpiTarget}
          onChange={(e) => setForm({ ...form, kpiTarget: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-4 md:w-fit"
        >
          반복업무 등록
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((t) => {
          const current = t.instances[0];
          const rate = current
            ? Math.round((current.kpiDone / Math.max(1, current.kpiTarget)) * 100)
            : 0;
          return (
            <article
              key={t.id}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-ink">{t.title}</h2>
                  <p className="text-xs text-muted">
                    {CADENCE_LABEL[t.cadence]} · 목표 {t.kpiTarget}건 ·{" "}
                    {t.assignee?.name ?? "미배정"}
                  </p>
                </div>
                <span className="text-sm font-bold text-accent">{rate}%</span>
              </div>
              {current && (
                <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
                  <p>
                    기간 {current.periodKey}: {current.kpiDone}/
                    {current.kpiTarget}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => bump(current, 1)}
                      className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      +1 완료
                    </button>
                    <button
                      type="button"
                      onClick={() => bump(current, -1)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      -1
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
