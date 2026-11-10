"use client";

import { useEffect, useState } from "react";
import { PAYMENT_KIND_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/os";
import { seoulToday, won } from "@/lib/office/money";

type Payment = {
  id: string;
  label: string;
  kind: keyof typeof PAYMENT_KIND_LABEL;
  amount: number;
  outstanding: number;
  dueDate: string;
  paidAt: string;
  status: keyof typeof PAYMENT_STATUS_LABEL;
  project?: { name: string; customer: { companyName: string } } | null;
};

type Project = { id: string; name: string; customer: string };

export default function ErpPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    projectId: "",
    label: "",
    kind: "DEPOSIT",
    amount: "",
    dueDate: seoulToday(),
  });

  function load() {
    fetch("/api/office/erp/payments")
      .then(async (response) => {
        const body = (await response.json()) as { payments: Payment[]; projects: Project[]; error?: string };
        if (!response.ok) setError(body.error || "수금 목록을 불러오지 못했습니다.");
        else {
          setPayments(body.payments);
          setProjects(body.projects);
        }
      })
      .catch(() => setError("수금 목록을 불러오지 못했습니다."));
  }

  useEffect(() => {
    load();
  }, []);

  async function createPayment(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/office/erp/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: form.projectId || null, amount: Number(form.amount) || 0 }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error || "등록하지 못했습니다.");
      return;
    }
    setForm((prev) => ({ ...prev, label: "", amount: "" }));
    load();
  }

  async function markPaid(id: string) {
    await fetch("/api/office/erp/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "PAID", paidAt: seoulToday() }),
    });
    load();
  }

  const receivable = payments.reduce((sum, payment) => sum + payment.outstanding, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">ERP</p>
          <h1>수금·미수</h1>
          <p>계약금, 중도금, 잔금을 등록하고 입금되면 완료로 바꿉니다. 미수 합계 {won(receivable)}</p>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <form className="card stack" onSubmit={createPayment}>
        <div className="consult-row">
          <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            <option value="">프로젝트 선택</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.customer} · {project.name}</option>
            ))}
          </select>
          <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
            {Object.entries(PAYMENT_KIND_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </div>
        <div className="consult-row">
          <input placeholder="항목명" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
          <input required placeholder="금액" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <button className="btn" type="submit">일정 등록</button>
        </div>
      </form>
      <section className="card" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>항목</th>
              <th>프로젝트</th>
              <th>금액</th>
              <th>예정일</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.label || PAYMENT_KIND_LABEL[payment.kind]}<div className="help">{PAYMENT_KIND_LABEL[payment.kind]}</div></td>
                <td>{payment.project?.name ?? "-"}<div className="help">{payment.project?.customer.companyName}</div></td>
                <td>{won(payment.amount)}</td>
                <td>{payment.dueDate || "-"}</td>
                <td>{PAYMENT_STATUS_LABEL[payment.status]}</td>
                <td>
                  {payment.outstanding > 0 ? (
                    <button className="btn-line" type="button" onClick={() => markPaid(payment.id)}>입금완료</button>
                  ) : payment.paidAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
