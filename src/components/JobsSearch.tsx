import Link from "next/link";
import {
  JOB_CATEGORIES,
  JOB_LOCATIONS,
  POST_TYPE_LABEL,
} from "@/lib/job-categories";

type JobsSearchProps = {
  type: "REQUEST" | "PROMOTE";
  category?: string;
  location?: string;
  q?: string;
};

export function JobsSearch({ type, category, location, q }: JobsSearchProps) {
  return (
    <form
      method="get"
      action="/jobs"
      className="rounded-2xl border border-line bg-white p-4 md:p-5"
    >
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            키워드
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="제목·내용 검색"
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 outline-none transition focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            카테고리
          </span>
          <select
            name="category"
            defaultValue={category ?? ""}
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 outline-none transition focus:border-accent"
          >
            <option value="">전체</option>
            {JOB_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            지역
          </span>
          <select
            name="location"
            defaultValue={location ?? ""}
            className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 outline-none transition focus:border-accent"
          >
            <option value="">전체</option>
            {JOB_LOCATIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft md:w-auto"
          >
            검색
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        현재 탭: {POST_TYPE_LABEL[type]} · 누구나 검색·열람 가능
      </p>
      <div className="sr-only">
        <Link href="/jobs">필터 초기화</Link>
      </div>
    </form>
  );
}
