"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InquiryComposer({ question }: { question: string }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState(question);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/home/inquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyName, message, question: question || message }),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "문의를 남기지 못했습니다.");
      return;
    }
    router.push("/mypage");
    router.refresh();
  }

  return (
    <form className="mt-8 rounded-3xl border border-line bg-white p-5" onSubmit={onSubmit}>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink-soft">상호</span>
        <input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
          placeholder="매장 또는 회사 이름"
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-medium text-ink-soft">문의 내용</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2"
          placeholder="업종, 하고 싶은 채널, 궁금한 점을 적어 주세요."
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="mt-4 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "보내는 중" : "문의 보내기"}
      </button>
    </form>
  );
}
