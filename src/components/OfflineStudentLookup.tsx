"use client";

import { useState } from "react";

type StudentResult = {
  name: string;
  phoneMasked: string;
  startDate: string;
  endDate: string;
  totalSessions: number | string;
  usedSessions: number | string;
  remainingSessions: number | string;
  sessionDates: string[];
};

export function OfflineStudentLookup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStudent(null);

    try {
      const response = await fetch("/api/offline-students/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        student?: StudentResult;
      };

      if (!response.ok || !data.ok || !data.student) {
        setError(data.message ?? "조회에 실패했습니다.");
        return;
      }

      setStudent(data.student);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-line bg-paper py-20 md:py-24">
      <div className="site-shell">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            My Course
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            오프라인 수강 정보 조회
          </h2>
          <p className="mt-3 text-muted">
            등록하신 성함과 전화번호를 입력하면 총 회차, 잔여 회차, 수업일을
            확인할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid max-w-2xl gap-4 rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_20px_50px_rgba(16,20,26,0.06)] md:grid-cols-[1fr_1fr_auto] md:p-8"
        >
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-ink">성함</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
              placeholder="홍길동"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-ink">전화번호</span>
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
              placeholder="010-0000-0000"
              autoComplete="tel"
              inputMode="tel"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {loading ? "조회 중..." : "조회하기"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-5 max-w-2xl rounded-2xl border border-accent/20 bg-white px-5 py-4 text-sm text-accent-deep">
            {error}
          </p>
        )}

        {student && (
          <div className="mt-8 max-w-3xl rounded-[1.75rem] border border-line bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                  Result
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold text-ink">
                  {student.name}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  연락처 {student.phoneMasked}
                </p>
              </div>
            </div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["수업 시작일", student.startDate],
                ["수업 종료일", student.endDate],
                ["총 회차", student.totalSessions],
                ["사용 회차", student.usedSessions],
                ["잔여 회차", student.remainingSessions],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-line bg-paper px-4 py-4"
                >
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <h4 className="text-sm font-semibold text-ink">회차별 수업일</h4>
              {student.sessionDates.length > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {student.sessionDates.map((date, index) => (
                    <li
                      key={`${date}-${index}`}
                      className="rounded-xl border border-line px-4 py-3 text-sm text-ink-soft"
                    >
                      <span className="font-semibold text-accent">
                        {index + 1}회
                      </span>{" "}
                      {date}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  등록된 회차별 수업일이 없습니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
