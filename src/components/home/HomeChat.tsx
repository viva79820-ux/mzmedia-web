"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type LinkItem = { href: string; label: string };

type Answer = {
  markdown: string;
  links: LinkItem[];
  needsInquiry: boolean;
};

type Turn = {
  id: string;
  question: string;
  answer?: Answer;
};

const samples = [
  "우리 회사에 필요한 서비스는?",
  "홈페이지 제작 비용은?",
  "기업 홍보영상 제작 문의",
  "블로그 콘텐츠 제작이 되나요?",
  "블로그 월간 관리를 맡길 수 있나요?",
  "인스타그램 운영은 어떻게 하나요?",
  "릴스·숏폼 제작이 가능한가요?",
  "네이버 파워링크 관리가 되나요?",
  "메타 광고 운영을 맡길 수 있나요?",
  "유튜브 채널 관리가 가능한가요?",
  "구글·유튜브 광고도 하나요?",
  "행사 영상 촬영이 되나요?",
  "인터뷰 촬영과 편집이 가능한가요?",
  "드론 촬영도 하나요?",
  "유튜브 실시간 중계는 어떻게 하나요?",
  "기업 홈페이지를 새로 만들 수 있나요?",
  "랜딩페이지 제작이 되나요?",
  "쇼핑몰 제작이 가능한가요?",
  "모바일 앱 개발도 하나요?",
  "예약 시스템 개발이 가능한가요?",
  "상세페이지 디자인이 되나요?",
  "로고·브랜드 디자인을 맡길 수 있나요?",
  "명함·전단지 인쇄가 되나요?",
  "현수막·배너 제작이 가능한가요?",
  "노트북 렌탈이 되나요?",
  "행사 음향 장비를 빌릴 수 있나요?",
  "온라인 강의는 어떤 내용인가요?",
  "오프라인 강의는 어떻게 신청하나요?",
  "견적은 어떻게 받나요?",
  "엠지미디어는 어떤 회사인가요?",
];

function pickSamples(list: readonly string[], count: number) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, count);
}

export function HomeChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shownSamples, setShownSamples] = useState<string[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShownSamples(pickSamples(samples, 3));
  }, []);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns]);

  async function ask(text: string) {
    const question = text.trim();
    if (question.length < 2) return;
    setBusy(true);
    setError("");
    const id = `q-${Date.now()}`;
    setTurns((current) => [...current, { id, question }]);
    setMessage("");
    const history = turns
      .filter((turn) => turn.answer?.markdown)
      .slice(-6)
      .map((turn) => ({ question: turn.question, answer: turn.answer?.markdown ?? "" }));
    const response = await fetch("/api/home/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: question, history }),
    });
    const body = (await response.json()) as Answer & { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "대답하지 못했습니다.");
      return;
    }
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, answer: body } : turn)));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(message).catch(() => setError("대답하지 못했습니다."));
  }

  function onQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    ask(message).catch(() => setError("대답하지 못했습니다."));
  }

  const started = turns.length > 0;
  const composer = (
    <form className={started ? "shrink-0 border-t border-line bg-paper" : "w-full"} onSubmit={onSubmit}>
      <div className={`mx-auto w-full max-w-3xl text-left ${started ? "px-4 py-3" : ""}`}>
        {started ? (
          <label htmlFor="home-question" className="mb-1 block text-xs font-semibold text-ink-soft">
            새 질문
          </label>
        ) : null}
        <div className={started ? "flex items-center gap-2" : "flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2"}>
          <textarea
            id="home-question"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={onQuestionKeyDown}
            rows={started ? 2 : 1}
            placeholder="어떤 도움이 필요하신가요?"
            className={started
              ? "min-w-0 flex-1 resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink"
              : "min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-ink outline-none"}
          />
          <button type="submit" disabled={busy} className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "검색 중" : "검색"}
          </button>
        </div>
      </div>
      {error ? <p className="mx-auto w-full max-w-3xl px-4 pb-3 text-left text-sm text-red-700">{error}</p> : null}
    </form>
  );

  return (
    <section className="flex h-full min-h-0 flex-col">
      {started ? (
        <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
            {turns.map((turn) => (
              <div key={turn.id} className="flex w-full flex-col gap-3 text-left">
                <article className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-ink">
                  <b className="mb-1 block text-xs text-muted">고객</b>
                  {turn.question}
                </article>
                {turn.answer ? (
                  <article className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink">
                    <b className="mb-1 block text-xs text-muted">엠지미디어</b>
                    <p className="whitespace-pre-wrap">{turn.answer.markdown}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {turn.answer.links.map((link) => (
                        <Link key={link.href} href={link.href} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">
                          {link.label}
                        </Link>
                      ))}
                    {turn.answer.needsInquiry ? (
                      <Link
                        href={`/inquiries?question=${encodeURIComponent(turn.question)}`}
                        className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        1:1 문의
                      </Link>
                    ) : null}
                  </div>
                </article>
                ) : null}
              </div>
            ))}
            <p className="text-center text-xs text-muted">
              <Link href="/inquiries" className="underline">1:1 문의</Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-accent">MZ MEDIA</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">비즈니스의 고민을 물어보세요</h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                마케팅부터 영상·디자인·웹·앱 개발까지.
                <br />
                기업에 필요한 솔루션을 엠지미디어에서 찾아보세요.
              </p>
            </div>
            {composer}
            <div className="flex flex-wrap justify-center gap-2">
              {shownSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="rounded-full border border-line bg-white px-3 py-2 text-sm text-ink-soft hover:text-ink"
                  onClick={() => ask(sample).catch(() => setError("대답하지 못했습니다."))}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {started ? composer : null}
    </section>
  );
}
