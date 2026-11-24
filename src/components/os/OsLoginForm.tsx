"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OsLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/os/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "로그인에 실패했습니다.");
        return;
      }
      const requested = search.get("next") ?? "/os";
      const next = /^\/(?:os|office)(?:\/[\w-]+)*\/?$/.test(requested)
        ? requested
        : "/os";
      router.replace(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
          MZ MEDIA OS
        </p>
        <h1 className="mt-2 text-xl font-bold text-ink">직원 로그인</h1>
        <p className="mt-1 text-sm text-muted">
          아이디는 본인 @mzmedia.co.kr 주소입니다. 주소가 생기기 전에는 기존 아이디로 들어옵니다.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">회사 메일</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          autoComplete="username"
          placeholder="name@mzmedia.co.kr"
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="text-sm text-accent-deep">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
      >
        {loading ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
