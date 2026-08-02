"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          privacyAgreed: form.get("privacyAgreed") === "on",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "회원가입에 실패했습니다.");
        return;
      }
      router.push("/jobs/new");
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
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block font-medium text-ink">아이디</span>
          <input
            required
            name="username"
            autoComplete="username"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="영문/숫자 4~20자"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block font-medium text-ink">비밀번호</span>
          <input
            required
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="8자 이상"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">성함</span>
          <input
            required
            name="name"
            autoComplete="name"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="홍길동"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">전화번호</span>
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="010-0000-0000"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block font-medium text-ink">이메일</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="hello@email.com"
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-ink-soft">
        <input
          required
          name="privacyAgreed"
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          개인정보 수집·이용에 동의합니다. (아이디, 성함, 연락처, 이메일은
          회원가입 및 공고 연락 목적으로 이용됩니다.)
        </span>
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
        {loading ? "가입 중…" : "회원가입"}
      </button>

      <p className="mt-4 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="font-semibold text-accent">
          로그인
        </Link>
      </p>
    </form>
  );
}
