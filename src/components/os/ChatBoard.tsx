"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { driveLinks } from "@/lib/chat";

type Message = {
  id: string;
  authorName: string;
  body: string;
  recorded: boolean;
  createdAt: string;
  mine: boolean;
};

function MessageBody({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/(?:drive|docs)\.google\.com\/[^\s)]+)/g);
  return (
    <p className="whitespace-pre-wrap text-sm">
      {parts.map((part, index) =>
        driveLinks(part).length > 0 ? (
          <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="text-accent underline">
            {part}
          </a>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </p>
  );
}

export function ChatBoard() {
  const router = useRouter();
  const search = useSearchParams();
  const customer = search.get("customer") ?? "";
  const [rooms, setRooms] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [works, setWorks] = useState<Array<{ id: string; title: string; quantity: number }>>([]);
  const [canRecord, setCanRecord] = useState(false);
  const [text, setText] = useState("");
  const [itemId, setItemId] = useState("");
  const [error, setError] = useState("");

  async function loadRooms() {
    const response = await fetch("/api/os/chat");
    if (!response.ok) return;
    const data = (await response.json()) as { rooms: Array<{ customerName: string }> };
    setRooms(data.rooms.map((room) => room.customerName));
  }

  async function loadRoom(name: string) {
    if (!name) return;
    const response = await fetch(`/api/os/chat?customer=${encodeURIComponent(name)}`);
    if (!response.ok) {
      setError("이 대화방을 열 수 없습니다.");
      return;
    }
    const data = (await response.json()) as {
      messages: Message[];
      works: Array<{ id: string; title: string; quantity: number }>;
      canRecord: boolean;
    };
    setMessages(data.messages);
    setWorks(data.works);
    setCanRecord(data.canRecord);
    setError("");
  }

  useEffect(() => {
    loadRooms().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!customer) return;
    loadRoom(customer).catch(() => undefined);
    const timer = window.setInterval(() => {
      loadRoom(customer).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [customer]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/os/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: customer, body: text, inboxItemId: itemId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "보내지 못했습니다.");
      return;
    }
    setText("");
    setItemId("");
    await loadRoom(customer);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">프로젝트 대화</p>
        <h1 className="text-2xl font-semibold text-ink">{customer || "대화방"}</h1>
        <p className="mt-1 text-sm text-muted">
          참여자는 대표, PM, 그 고객사에 배정된 생산팀입니다. 드라이브 링크는 새 창으로 열립니다. 대화만으로는 완료 근거가 되지 않습니다.
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {rooms.length === 0 ? <p className="text-sm text-muted">배정된 업무가 있는 고객사만 대화방이 생깁니다.</p> : null}
        {rooms.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => router.push(`/os/chat?customer=${encodeURIComponent(name)}`)}
            className={`rounded-full px-3 py-1 text-sm ${name === customer ? "bg-accent text-white" : "border border-line bg-white"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {customer ? (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-4">
          <div className="max-h-[28rem] space-y-3 overflow-y-auto">
            {messages.length === 0 ? <p className="text-sm text-muted">아직 메시지가 없습니다.</p> : null}
            {messages.map((message) => (
              <article key={message.id} className={message.mine ? "text-right" : ""}>
                <p className="text-xs text-muted">
                  {message.authorName} · {new Date(message.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                  {message.recorded ? " · 업무에 남김" : ""}
                </p>
                <div className={`mt-1 inline-block rounded-xl px-3 py-2 ${message.mine ? "bg-accent/10" : "bg-paper"}`}>
                  <MessageBody text={message.body} />
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={send} className="space-y-2">
            <textarea
              required
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="메시지 또는 https://drive.google.com/... 링크"
              className="min-h-20 w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
            {canRecord && works.length > 0 ? (
              <select value={itemId} onChange={(event) => setItemId(event.target.value)} className="rounded-lg border border-line px-2 py-1 text-sm">
                <option value="">대화만 보내기</option>
                {works.map((work) => (
                  <option key={work.id} value={work.id}>
                    업무에 한 줄 남기기 · {work.title} {work.quantity}건
                  </option>
                ))}
              </select>
            ) : null}
            <button className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">보내기</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
