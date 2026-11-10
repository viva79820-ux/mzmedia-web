"use client";

import { useEffect, useState } from "react";

type Seat = {
  recordId: string;
  name: string;
  desk?: "장부" | "제작" | "대기";
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

  const desks = [
    { key: "장부" as const, title: "장부", copy: "돈은 여기서 보고, 장부에 넣는 확인은 대표가 합니다." },
    { key: "제작" as const, title: "제작", copy: "견적, 바이럴, 영상, 개발, 디자인은 일의 종류로 나눕니다." },
    { key: "대기" as const, title: "대기", copy: "렌탈과 교육은 문의가 확인되기 전에는 자리만 둡니다." },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Organization</p>
          <h1>담당</h1>
          <p>엠지몬이 말을 맡고, 장부가 숫자를 맡습니다. 담당은 고객마다 만들지 않습니다.</p>
        </div>
      </header>
      <div className="stack">
        {desks.map((desk) => {
          const seats = data.seats.filter((seat) => (seat.desk ?? "제작") === desk.key);
          return (
            <section key={desk.key} className="card">
              <h2>{desk.title}</h2>
              <p className="help">{desk.copy}</p>
              <table>
                <thead>
                  <tr>
                    <th>담당</th>
                    <th>맡는 일</th>
                    <th>같이 있는 사람</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {seats.map((seat) => (
                    <tr key={seat.recordId}>
                      <td>
                        <b>{seat.name}</b>
                      </td>
                      <td>
                        {seat.duty}
                        <div className="help">{seat.phase}</div>
                      </td>
                      <td>{seat.person}</td>
                      <td>{label(seat.status, seat.mode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
      {error ? <p className="error">{error}</p> : null}
    </>
  );
}
