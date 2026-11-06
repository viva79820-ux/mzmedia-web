"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeNext } from "@/lib/safe-next";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"), "/jobs/new");
  const forInquiry = next.startsWith("/mypage") || next.startsWith("/inquiries");
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
          termsAgreed: form.get("termsAgreed") === "on",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "회원가입에 실패했습니다.");
        return;
      }
      router.push(next);
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
      {forInquiry ? (
        <p className="mb-5 rounded-2xl bg-paper px-4 py-3 text-sm leading-6 text-ink-soft">
          1:1 문의는 회원가입 후 이용합니다. 접수한 내용과 대표 답변은 마이페이지에서 확인합니다.
        </p>
      ) : null}
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

      <div className="mt-5 grid gap-3">
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input required name="termsAgreed" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
          <span>
            <Link href="/terms" className="font-semibold text-accent underline" target="_blank">
              이용약관
            </Link>
            에 동의합니다. 현재 문서는 시행 전 초안입니다.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input required name="privacyAgreed" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
          <span>
            <Link href="/privacy" className="font-semibold text-accent underline" target="_blank">
              개인정보 수집·이용
            </Link>
            에 동의합니다. 아이디, 성함, 연락처, 이메일, 문의 내용은 회원가입과 1:1 답변에 사용됩니다.
          </span>
        </label>
      </div>

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
        <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="font-semibold text-accent">
          로그인
        </Link>
      </p>
    </form>
  );
}
