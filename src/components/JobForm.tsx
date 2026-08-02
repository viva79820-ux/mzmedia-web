"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  JOB_CATEGORIES,
  JOB_LOCATIONS,
  POST_TYPE_LABEL,
} from "@/lib/job-categories";

type JobFormProps = {
  defaultType?: "REQUEST" | "PROMOTE";
};

export function JobForm({ defaultType = "REQUEST" }: JobFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.get("type"),
          category: form.get("category"),
          title: form.get("title"),
          content: form.get("content"),
          budget: form.get("budget"),
          location: form.get("location"),
          contact: form.get("contact"),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        message?: string;
      };

      if (res.status === 401) {
        router.push("/auth/login?next=/jobs/new");
        return;
      }
      if (!res.ok || !data.ok || !data.id) {
        setError(data.message ?? "공고 등록에 실패했습니다.");
        return;
      }
      router.push(`/jobs/${data.id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
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
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm font-medium text-ink">공고 유형</legend>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(POST_TYPE_LABEL) as Array<"REQUEST" | "PROMOTE">).map(
              (type) => (
                <label
                  key={type}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    defaultChecked={type === defaultType}
                    required
                  />
                  {POST_TYPE_LABEL[type]}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">카테고리</span>
          <select
            required
            name="category"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
          >
            <option value="" disabled>
              선택해 주세요
            </option>
            {JOB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">지역</span>
          <select
            name="location"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
          >
            <option value="">선택 안 함</option>
            {JOB_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block font-medium text-ink">제목</span>
          <input
            required
            name="title"
            maxLength={120}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="예: 제품 소개 숏폼 영상 편집 의뢰"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">예산 (선택)</span>
          <input
            name="budget"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="예: 50만 원 / 협의"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium text-ink">연락처 (선택)</span>
          <input
            name="contact"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="전화, 이메일, 카카오 등"
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="mb-2 block font-medium text-ink">상세 내용</span>
          <textarea
            required
            name="content"
            rows={10}
            minLength={10}
            className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 outline-none transition focus:border-accent"
            placeholder="작업 범위, 일정, 참고 자료, 희망 조건 등을 적어 주세요."
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? "등록 중…" : "공고 등록"}
        </button>
        <Link
          href="/jobs"
          className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink-soft"
        >
          목록으로
        </Link>
      </div>
    </form>
  );
}
