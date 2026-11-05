"use client";

import { useEffect, useState } from "react";

type Seat = {
  recordId: string;
  name: string;
  duty: string;
  person: string;
  mode: "ON" | "SEAT";
  phase: string;
  status: string;
  version: number;
  instructions: string;
};

type Board = {
  cap: number;
  openCount: number;
  seats: Seat[];
};

function label(status: string, mode: "ON" | "SEAT") {
  if (status === "PENDING_APPROVAL") return "승인 대기";
  if (status === "DISABLED" || status === "ARCHIVED") return "끔";
  if (status === "SEAT" || mode === "SEAT") return "자리만";
  if (status === "ACTIVE" || mode === "ON") return "켬";
  return status;
}

export default function BackendPage() {
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/office/backend")
      .then(async (response) => {
        const body = (await response.json()) as Board & { error?: string };
        if (!response.ok) setError(body.error || "담당 목록을 불러오지 못했습니다.");
        else setData(body);
      })
      .catch(() => setError("담당 목록을 불러오지 못했습니다."));
  }, []);

  if (!data) return <p className="help">{error || "담당 목록을 불러오는 중입니다."}</p>;

  const on = data.seats.filter((seat) => seat.mode === "ON").length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Backend</p>
          <h1>백엔드</h1>
          <p>엠지몬 아래 담당입니다. 고객마다 만들지 않고, 일의 종류로 나눕니다.</p>
        </div>
      </header>
      <section className="stats">
        <article className="card stat">
          <span>켠 담당</span>
          <strong>{on}</strong>
        </article>
        <article className="card stat">
          <span>자리만</span>
          <strong>{data.seats.length - on}</strong>
        </article>
        <article className="card stat">
          <span>상한에 포함</span>
          <strong>{data.openCount}</strong>
        </article>
        <article className="card stat">
          <span>상한</span>
          <strong>{data.cap}</strong>
        </article>
      </section>
      <section className="card" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>담당</th>
              <th>맡는 일</th>
              <th>같이 있는 사람</th>
              <th>상태</th>
              <th>켜는 시점</th>
            </tr>
          </thead>
          <tbody>
            {data.seats.map((seat) => (
              <tr key={seat.recordId}>
                <td>
                  <b>{seat.name}</b>
                  <div className="help">{seat.version}판</div>
                </td>
                <td>
                  {seat.duty}
                  <div className="help">{seat.instructions}</div>
                </td>
                <td>{seat.person}</td>
                <td>{label(seat.status, seat.mode)}</td>
                <td>{seat.phase}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </>
  );
}
