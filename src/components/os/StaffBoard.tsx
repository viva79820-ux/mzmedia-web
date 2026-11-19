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

function localPart(email?: string) {
  if (!email?.endsWith("@mzmedia.co.kr")) return "";
  return email.slice(0, email.length - "@mzmedia.co.kr".length);
}

export function StaffBoard() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [locals, setLocals] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyLocal: "",
    name: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
  });

  async function load() {
    const res = await fetch("/api/os/staff");
    if (!res.ok) {
      setMessage("직원 목록을 불러올 권한이 없거나 실패했습니다.");
      return;
    }
    const rows = ((await res.json()) as { staff: StaffRow[] }).staff;
    setStaff(rows);
    setLocals(Object.fromEntries(rows.map((row) => [row.id, localPart(row.email)])));
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
    setMessage("직원이 등록되었습니다. 로그인은 회사 메일로 합니다.");
    setForm({
      companyLocal: "",
      name: "",
      password: "",
      role: "EMPLOYEE",
      department: "",
    });
    await load();
  }

  async function saveMail(row: StaffRow) {
    const res = await fetch("/api/os/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, companyLocal: locals[row.id] ?? "" }),
    });
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      setMessage(data.message ?? "주소를 저장하지 못했습니다.");
      return;
    }
    setMessage("회사 메일이 로그인 아이디로 저장되었습니다. 메일함은 워크스페이스에 그대로 둡니다.");
    await load();
  }

  async function toggleActive(row: StaffRow) {
    const res = await fetch("/api/os/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, active: !row.active }),
    });
    if (!res.ok) {
      setMessage("상태를 바꾸지 못했습니다.");
      return;
    }
    setMessage(row.active ? "로그인을 막았습니다. 회사 메일 주소는 남아 있습니다." : "다시 로그인할 수 있습니다.");
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">직원 · 회사 메일</h1>
        <p className="mt-1 text-sm text-muted">
          재직 중인 사람의 로그인 아이디는 사람마다 하나인 @mzmedia.co.kr 주소입니다. 메일함은 구글 워크스페이스에서 만들고, 오피스는 그 주소를 지우지 않습니다. 고객사 드라이브 권한도 이 주소로 줍니다.
        </p>
      </div>

      <form
        onSubmit={createStaff}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-3"
      >
        <input
          required
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
        />
        <label className="flex items-center rounded-xl border border-line bg-paper px-3 py-2 text-sm">
          <input
            required
            placeholder="name"
            value={form.companyLocal}
            onChange={(e) => setForm({ ...form, companyLocal: e.target.value })}
            className="w-full bg-transparent outline-none"
          />
          <span className="shrink-0 text-muted">@mzmedia.co.kr</span>
        </label>
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
              <th className="px-3 py-2">회사 메일</th>
              <th className="px-3 py-2">역할</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id} className="border-b border-line/70">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={locals[row.id] ?? ""}
                      onChange={(e) => setLocals({ ...locals, [row.id]: e.target.value })}
                      placeholder="주소 앞부분"
                      className="w-36 rounded-lg border border-line px-2 py-1"
                    />
                    <span className="text-muted">@mzmedia.co.kr</span>
                    <button type="button" onClick={() => saveMail(row)} className="text-xs font-semibold text-accent">
                      저장
                    </button>
                  </div>
                  {row.username !== row.email ? (
                    <p className="mt-1 text-xs text-muted">주소 저장 전 로그인: {row.username}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2">{STAFF_ROLE_LABEL[row.role]}</td>
                <td className="px-3 py-2">{row.active ? "재직" : "비활성"}</td>
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
