"use client";

import { useEffect, useState } from "react";
import { STAFF_ROLE_LABEL } from "@/lib/os";
import type { StaffRole } from "@/generated/prisma/client";

type StaffRow = {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  active: boolean;
  department?: string;
};

export function StaffBoard() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "EMPLOYEE",
    email: "",
    department: "",
  });

  async function load() {
    const res = await fetch("/api/os/staff");
    if (!res.ok) {
      setMessage("직원 목록을 불러올 권한이 없거나 실패했습니다.");
      return;
    }
    setStaff(((await res.json()) as { staff: StaffRow[] }).staff);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/os/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "등록 실패");
      return;
    }
    setMessage("직원이 등록되었습니다.");
    setForm({
      username: "",
      name: "",
      password: "",
      role: "EMPLOYEE",
      email: "",
      department: "",
    });
    await load();
  }

  async function toggleActive(row: StaffRow) {
    await fetch("/api/os/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, active: !row.active }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">직원 · 권한</h1>
        <p className="mt-1 text-sm text-muted">
          Staff 계정은 작업의뢰 회원(User)과 분리됩니다.
        </p>
      </div>

      <form
        onSubmit={createStaff}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
      >
        <input
          required
          placeholder="아이디"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          required
          type="password"
          placeholder="초기 비밀번호"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        >
          {Object.entries(STAFF_ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          placeholder="이메일"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <input
          placeholder="부서"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-3 md:w-fit"
        >
          직원 등록
        </button>
        {message && (
          <p className="text-sm text-muted md:col-span-3">{message}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">역할</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id} className="border-b border-line/70">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">@{row.username}</td>
                <td className="px-3 py-2">{STAFF_ROLE_LABEL[row.role]}</td>
                <td className="px-3 py-2">{row.active ? "활성" : "비활성"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(row)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold"
                  >
                    {row.active ? "비활성화" : "활성화"}
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
