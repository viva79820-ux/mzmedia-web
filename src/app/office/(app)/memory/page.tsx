"use client";

import { FormEvent, useEffect, useState } from "react";
import { MEMORY_LABEL, formatWhen } from "@/lib/office/labels";
import type { Memory, MemoryKind } from "@/lib/office/types";

export default function MemoryPage() {
  const [items, setItems] = useState<Memory[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memoryKind, setMemoryKind] = useState<"rule" | "feedback">("rule");
  const [error, setError] = useState("");

  async function load(nextQuery = query, nextKind = kind) {
    const response = await fetch(`/api/office/memory?q=${encodeURIComponent(nextQuery)}&kind=${encodeURIComponent(nextKind)}`);
    const data = (await response.json()) as { items?: Memory[]; error?: string };
    if (!response.ok) setError(data.error || "기억을 불러오지 못했습니다.");
    else setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await load();
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/office/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: memoryKind, title, content }),
    });
    const data = (await response.json()) as { items?: Memory[]; error?: string };
    if (!response.ok) {
      setError(data.error || "저장하지 못했습니다.");
      return;
    }
    setTitle("");
    setContent("");
    setItems(data.items || []);
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Memory</p>
          <h1>기억 관리</h1>
          <p>성공, 실패, 피드백, 업무 규칙, 개선 이력을 다음 계획에서 다시 읽습니다.</p>
        </div>
      </header>
      <section className="grid-2">
        <div className="stack">
          <form className="card actions" onSubmit={onSearch}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="과거 작업, 규칙, 실패 원인" />
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="">전체</option>
              {Object.entries(MEMORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button className="btn" type="submit">검색</button>
          </form>
          {error ? <p className="error">{error}</p> : null}
          {items.map((item) => (
            <article className="card" key={item.id}>
              <p className="badge">{MEMORY_LABEL[item.kind as MemoryKind]}</p>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
              <p className="help">{formatWhen(item.createdAt)}</p>
            </article>
          ))}
        </div>
        <form className="card stack" onSubmit={onCreate}>
          <h2>규칙 또는 피드백 추가</h2>
          <label>
            종류
            <select value={memoryKind} onChange={(event) => setMemoryKind(event.target.value as "rule" | "feedback")}>
              <option value="rule">업무 규칙</option>
              <option value="feedback">피드백</option>
            </select>
          </label>
          <label>
            제목
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            내용
            <textarea value={content} onChange={(event) => setContent(event.target.value)} />
          </label>
          <button className="btn" type="submit">저장</button>
        </form>
      </section>
    </>
  );
}
