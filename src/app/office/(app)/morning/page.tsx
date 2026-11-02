"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Morning = {
  today: string;
  monthStart: boolean;
  paydaySoon: boolean;
  meetings: { id: string; company: string; title: string; stage: string }[];
  retainers: { name: string; line: string; quota: string; assignee: string; published: string }[];
  moonmiyoung: string;
  videos: { id: string; name: string; dueDate: string; reason: string }[];
  collections: { id: string; company: string; label: string; dueDate: string; amountLabel: string; state: string }[];
  approvals: { id: string; company: string; title: string }[];
  staff: string[];
  exceptions: { id: string; title: string; reason: string; assignee: string; dueDate: string }[];
  exceptionCount: number;
};

export default function MorningPage() {
  const [data, setData] = useState<Morning | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/office/morning")
      .then(async (response) => {
        const body = (await response.json()) as Morning & { error?: string };
        if (!response.ok) {
          setError(body.error || "아침 보고를 불러오지 못했습니다.");
          return;
        }
        setData(body);
      })
      .catch(() => setError("아침 보고를 불러오지 못했습니다."));
  }, []);

  if (!data) return <p className="help">{error || "아침 보고를 불러오는 중입니다."}</p>;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">PM · 아침</p>
          <h1>아침 보고</h1>
          <p>
            {data.today}. 수업 일정은 운영 DB에 없어 확인 필요합니다. 아래는 오늘 상담, 편집 공백, 수량 미확인, 수금 후보, 승인만 모았습니다.
            고객에게 보내지 않았고, 입금 완료로 바꾸지 않았습니다.
          </p>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <section className="grid-2">
        <article className="card">
          <h2>오늘 상담</h2>
          {data.meetings.length === 0 ? <p className="help">오늘 날짜로 잡힌 상담이 없습니다.</p> : null}
          {data.meetings.map((item) => (
            <p key={item.id} className="help">
              <strong>{item.company}</strong> · {item.stage}
              {item.title ? ` · ${item.title}` : ""}
            </p>
          ))}
          <p className="help">수업은 이 목록에 없습니다. 정화중·밀양 수업은 캘린더에만 있고 운영 DB와 연결되지 않았습니다.</p>
        </article>
        <article className="card">
          <h2>편집 공백</h2>
          <p className="help">담당이 확인된 영상편집 인력이 없습니다. 대표 할 일로 조용히 넣지 않고 예외로 올립니다.</p>
          {data.videos.map((item) => (
            <p key={item.id} className="help">
              <strong>{item.reason}</strong> {item.name}
              {item.dueDate ? ` · ${item.dueDate}` : ""}
            </p>
          ))}
        </article>
      </section>
      <section className="grid-2">
        <article className="card">
          <h2>월 수량</h2>
          <p className="help">{data.moonmiyoung} 게시 완료 수가 없어 발행률은 계산하지 않습니다.</p>
          {data.retainers.map((item) => (
            <p key={item.name} className="help">
              <strong>{item.name}</strong> · {item.line} · 월 수량 {item.quota} · 담당 {item.assignee} · 게시 {item.published}
            </p>
          ))}
        </article>
        <div className="stack">
          <article className="card">
            <h2>수금 후보</h2>
            <p className="help">요청 문안은 대표 승인 전입니다. 이 화면은 발송하지 않고, 입금을 완료로 표시하지 않습니다.</p>
            {data.collections.length === 0 ? <p className="help">이번 주 청구·지연 후보가 운영 DB에 없습니다. 확인 필요.</p> : null}
            {data.collections.map((item) => (
              <p key={item.id} className="help">
                <strong>{item.state}</strong> {item.company}
                {item.label ? ` · ${item.label}` : ""} · {item.amountLabel}
                {item.dueDate ? ` · ${item.dueDate}` : " · 지급일 확인 필요"}
              </p>
            ))}
          </article>
          <article className="card">
            <h2>대표 승인</h2>
            {data.approvals.length === 0 ? <p className="help">체결 전 계약 초안이 없습니다.</p> : null}
            {data.approvals.map((item) => (
              <p key={item.id} className="help">
                <Link href="/os/contracts">{item.company}</Link> · {item.title}
              </p>
            ))}
            <p className="help">견적 금액, 납기 변경, 채용, 고객 발송은 여기서 확정하지 않습니다.</p>
          </article>
        </div>
      </section>
      {data.monthStart || data.paydaySoon ? (
        <section className="grid-2">
          {data.monthStart ? (
            <article className="card">
              <h2>월초 묶음</h2>
              <p className="help">거래처 보고서는 게시 완료 수가 확인된 뒤에만 숫자를 씁니다. 지금은 모두 확인 필요합니다.</p>
              {data.retainers.map((item) => (
                <p key={`report-${item.name}`} className="help">
                  {item.name} 보고서 초안 · 게시 완료 확인 필요
                </p>
              ))}
            </article>
          ) : null}
          {data.paydaySoon ? (
            <article className="card">
              <h2>급여일</h2>
              <p className="help">이번 달 급여 기준일은 10일입니다. 금액은 회계가 계산합니다. 이 화면은 이체하지 않습니다.</p>
              <p className="help">재직 직원: {data.staff.length ? data.staff.join(", ") : "확인 필요"}</p>
            </article>
          ) : null}
        </section>
      ) : null}
      <article className="card">
        <h2>막힌 제작</h2>
        {data.exceptions.length === 0 ? <p className="help">막힌 일이 없습니다.</p> : null}
        {data.exceptions.map((item) => (
          <p key={item.id} className="help">
            <strong>{item.reason}</strong> {item.title}
            {item.assignee ? ` · ${item.assignee}` : ""}
            {item.dueDate ? ` · ${item.dueDate}` : ""}
          </p>
        ))}
        {data.exceptionCount > data.exceptions.length ? (
          <p className="help">
            예외 {data.exceptionCount}건 중 {data.exceptions.length}건입니다. <Link href="/office/work">착수·예외</Link>
          </p>
        ) : null}
      </article>
    </>
  );
}
