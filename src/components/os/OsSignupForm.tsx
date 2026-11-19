"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OsSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/os/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setError(data.message ?? "회원가입에 실패했습니다.");
        return;
      }
      router.replace("/os");
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
        <h1 className="mt-2 text-xl font-bold text-ink">회원가입</h1>
        <p className="mt-1 text-sm text-muted">
          회사 메일로 가입하면 생산팀으로 들어갑니다. 역할 변경은 대표가 합니다.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">이름</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          autoComplete="name"
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">회사 메일</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
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
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          autoComplete="new-password"
          minLength={4}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">비밀번호 확인</span>
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          autoComplete="new-password"
          minLength={4}
          required
        />
      </label>
      {error ? <p className="text-sm text-accent-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
      >
        {loading ? "등록 중..." : "가입하기"}
      </button>
      <Link href="/os/login" className="block text-center text-sm font-semibold text-accent">
        로그인으로 돌아가기
      </Link>
    </form>
  );
}
