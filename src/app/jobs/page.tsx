import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { JobsSearch } from "@/components/JobsSearch";
import { POST_TYPE_LABEL } from "@/lib/job-categories";
import { formatJobDate, listJobs } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "작업의뢰정보",
  description: "작업의뢰·업체홍보 공고를 검색하고 열람하세요.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  type?: string;
  category?: string;
  location?: string;
  q?: string;
  page?: string;
}>;

function buildQuery(params: {
  type: string;
  category?: string;
  location?: string;
  q?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  sp.set("type", params.type);
  if (params.category) sp.set("category", params.category);
  if (params.location) sp.set("location", params.location);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return `/jobs?${sp.toString()}`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const type = sp.type === "PROMOTE" ? "PROMOTE" : "REQUEST";
  const category = sp.category?.trim() || undefined;
  const location = sp.location?.trim() || undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page || "1") || 1);

  let result: Awaited<ReturnType<typeof listJobs>> | null = null;
  let loadError = false;
  try {
    result = await listJobs({ type, category, location, q, page });
  } catch {
    loadError = true;
  }

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;

  return (
    <>
      <PageHero
        eyebrow="Jobs"
        title="작업의뢰정보"
        description="외주·협업이 필요할 때 의뢰를 올리고, 업체를 홍보하세요. 검색과 열람은 누구나, 글쓰기는 회원만 가능합니다."
        cta={{ href: "/jobs/new", label: "공고 등록하기" }}
      />

      <section className="border-b border-line bg-paper-deep/40 py-6">
        <div className="site-shell">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["REQUEST", POST_TYPE_LABEL.REQUEST],
                ["PROMOTE", POST_TYPE_LABEL.PROMOTE],
              ] as const
            ).map(([value, label]) => {
              const active = type === value;
              const href = buildQuery({
                type: value,
                category,
                location,
                q,
              });
              return (
                <Link
                  key={value}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4">
            <JobsSearch
              type={type}
              category={category}
              location={location}
              q={q}
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="site-shell">
          {loadError ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              데이터베이스에 연결하지 못했습니다. Neon/`DATABASE_URL` 설정을
              확인해 주세요.
            </p>
          ) : result && result.posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-16 text-center">
              <p className="font-display text-2xl font-bold text-ink">
                등록된 공고가 없습니다
              </p>
              <p className="mt-3 text-sm text-muted">
                첫 공고를 등록해 매칭을 시작해 보세요.
              </p>
              <Link
                href="/jobs/new"
                className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
              >
                공고 등록
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                총 {result?.total ?? 0}건
              </p>
              <ul className="divide-y divide-line border-y border-line">
                {result?.posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/jobs/${post.id}`}
                      className="group flex flex-col gap-2 py-5 transition hover:bg-paper/70 md:flex-row md:items-center md:justify-between md:gap-6 md:px-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="rounded-full bg-teal-soft px-2.5 py-1 font-semibold text-teal">
                            {POST_TYPE_LABEL[post.type]}
                          </span>
                          <span>{post.category}</span>
                          {post.location && <span>· {post.location}</span>}
                        </div>
                        <h2 className="mt-2 truncate text-lg font-semibold text-ink group-hover:text-accent">
                          {post.title}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {post.author.name} · 조회 {post.views}
                          {post.budget ? ` · 예산 ${post.budget}` : ""}
                        </p>
                      </div>
                      <time className="shrink-0 text-sm text-muted">
                        {formatJobDate(post.createdAt)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={buildQuery({
                        type,
                        category,
                        location,
                        q,
                        page: page - 1,
                      })}
                      className="rounded-full border border-line px-4 py-2 text-sm"
                    >
                      이전
                    </Link>
                  )}
                  <span className="px-3 text-sm text-muted">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={buildQuery({
                        type,
                        category,
                        location,
                        q,
                        page: page + 1,
                      })}
                      className="rounded-full border border-line px-4 py-2 text-sm"
                    >
                      다음
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
