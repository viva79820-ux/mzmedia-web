"use client";

import { FormEvent, useEffect, useState } from "react";

type ExceptionItem = {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  reason: string;
};

type StaffOption = { id: string; name: string; role: string };
type PackageItem = { id: string; goal: string };

const ROLE: Record<string, string> = {
  SUPER_ADMIN: "대표",
  MANAGER: "관리",
  EMPLOYEE: "직원",
  FREELANCER: "외주",
};

export default function WorkPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [businessLine, setBusinessLine] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const response = await fetch("/api/office/work");
    const body = (await response.json()) as {
      exceptions?: ExceptionItem[];
      staff?: StaffOption[];
      packages?: PackageItem[];
      error?: string;
    };
    if (!response.ok) {
      setError(body.error || "업무 현황을 불러오지 못했습니다.");
      return;
    }
    setExceptions(body.exceptions || []);
    setStaff(body.staff || []);
    setPackages(body.packages || []);
  }

  useEffect(() => {
    load().catch(() => setError("업무 현황을 불러오지 못했습니다."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/office/work", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, title, dueDate, assigneeId, businessLine }),
    });
    const body = (await response.json()) as { created?: number; already?: boolean; exceptions?: ExceptionItem[]; error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error || "할일을 만들지 못했습니다.");
      return;
    }
    setNotice(body.already ? "이미 직원 할일로 넘어가 있습니다." : `할일 ${body.created}건을 만들었습니다.`);
    if (body.exceptions) setExceptions(body.exceptions);
    else await load();
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">V4 · PM</p>
          <h1>착수와 예외</h1>
          <p>대표는 막힌 일만 봅니다. 할일 단계는 사업마다 다릅니다.</p>
        </div>
      </header>
      <section className="grid-2">
        <article className="card">
          <h2>지금 볼 예외</h2>
          {exceptions.length === 0 ? <p className="help">마감이 지났거나 담당이 비어 있는 일이 없습니다.</p> : null}
          <div className="stack">
            {exceptions.map((item) => (
              <div key={item.id}>
                <strong>{item.reason}</strong>
                <p className="help">
                  {item.title}
                  {item.assignee ? ` · ${item.assignee}` : ""}
                  {item.dueDate ? ` · ${item.dueDate}` : ""}
                </p>
              </div>
            ))}
          </div>
        </article>
        <form className="card stack" onSubmit={onSubmit}>
          <h2>직원에게 넘기기</h2>
          <label>
            전달 패키지
            <select
              value={jobId}
              onChange={(event) => {
                const next = event.target.value;
                setJobId(next);
                const found = packages.find((item) => item.id === next);
                if (found) setTitle(found.goal.replace(/^고객 전달 패키지:?\s*/, ""));
              }}
            >
              <option value="">직접 입력</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.goal}
                </option>
              ))}
            </select>
          </label>
          <label>
            사업
            <select value={businessLine} onChange={(event) => setBusinessLine(event.target.value)} required>
              <option value="">선택</option>
              <option value="MARKETING_RETAINER">온라인마케팅</option>
              <option value="VIDEO_PRODUCTION">영상</option>
              <option value="WEB_APP_DEVELOPMENT">홈페이지·앱·AI</option>
              <option value="EQUIPMENT_RENTAL">장비 렌탈</option>
              <option value="EDUCATION_COURSE">교육</option>
              <option value="DESIGN_PRINT">디자인·인쇄</option>
            </select>
          </label>
          <label>
            작업 이름
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            납품일
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label>
            담당
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">나중에 지정</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {ROLE[person.role] || person.role}
                </option>
              ))}
            </select>
          </label>
          <p className="help">문미영은 담당 고객 수를 확인하기 전에는 새 배정을 받지 않습니다. 고객 발송은 만들지 않습니다.</p>
          {error ? <p className="error">{error}</p> : null}
          {notice ? <p className="help">{notice}</p> : null}
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "할일을 만드는 중" : "사업별 할일 만들기"}
          </button>
        </form>
      </section>
    </>
  );
}
