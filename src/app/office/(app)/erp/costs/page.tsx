"use client";

import { useEffect, useState } from "react";
import { COST_CLASSES, seoulToday, won } from "@/lib/office/money";

type Cost = {
  id: string;
  label: string;
  category: string;
  amount: number;
  spentAt: string;
  memo: string;
  project?: { name: string; customer: { companyName: string } } | null;
};

type Project = { id: string; name: string };

export default function ErpCostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    label: "",
    category: "변동비",
    amount: "",
    spentAt: seoulToday(),
    recurring: false,
  });

  function load() {
    fetch("/api/office/erp/costs")
      .then(async (response) => {
        const body = (await response.json()) as { costs: Cost[]; projects: Project[]; error?: string };
        if (!response.ok) setError(body.error || "지출을 불러오지 못했습니다.");
        else {
          setCosts(body.costs);
          setProjects(body.projects);
        }
      })
      .catch(() => setError("지출을 불러오지 못했습니다."));
  }

  useEffect(() => {
    load();
  }, []);

  async function createCost(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/office/erp/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || null,
        amount: Number(form.amount) || 0,
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error || "등록하지 못했습니다.");
      return;
    }
    setForm((prev) => ({ ...prev, label: "", amount: "" }));
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("이 지출을 삭제할까요?")) return;
    await fetch(`/api/office/erp/costs?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">ERP</p>
          <h1>지출</h1>
          <p>고정비는 매월 반복으로 두면 다음 달 지출이 생깁니다. 대출 원금은 금융지출로 둡니다.</p>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <form className="card stack" onSubmit={createCost}>
        <div className="consult-row">
          <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            <option value="">회사 공통비용</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {COST_CLASSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input type="date" value={form.spentAt} onChange={(event) => setForm({ ...form, spentAt: event.target.value })} />
        </div>
        <div className="consult-row">
          <input required placeholder="항목. 예: 임대료" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
          <input required placeholder="금액" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <button className="btn" type="submit">지출 등록</button>
        </div>
        <label>
          <span>
            <input type="checkbox" checked={form.recurring} onChange={(event) => setForm({ ...form, recurring: event.target.checked })} /> 매월 같은 금액으로 반복
          </span>
        </label>
      </form>
      <section className="card" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>프로젝트</th>
              <th>구분</th>
              <th>금액</th>
              <th>일자</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost) => (
              <tr key={cost.id}>
                <td>{cost.label}{cost.memo.includes("매월") ? <span className="help"> 매월</span> : null}</td>
                <td>{cost.project?.name ?? "회사 공통"}</td>
                <td>{cost.category}</td>
                <td>{won(cost.amount)}</td>
                <td>{cost.spentAt || "-"}</td>
                <td><button className="btn-line danger" type="button" onClick={() => remove(cost.id)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
