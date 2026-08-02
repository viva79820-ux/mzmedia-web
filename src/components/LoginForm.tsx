"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/jobs";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "로그인에 실패했습니다.");
        return;
      }
      router.push(next.startsWith("/") ? next : "/jobs");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_20px_50px_rgba(16,20,26,0.06)] md:p-8"
    >
      <label className="block text-sm">
        <span className="mb-2 block font-medium text-ink">아이디</span>
        <input
          required
          name="username"
          autoComplete="username"
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
        />
      </label>
      <label className="mt-5 block text-sm">
        <span className="mb-2 block font-medium text-ink">비밀번호</span>
        <input
          required
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
      >
        {loading ? "로그인 중…" : "로그인"}
      </button>

      <p className="mt-4 text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/auth/signup" className="font-semibold text-accent">
          회원가입
        </Link>
      </p>
    </form>
  );
}
