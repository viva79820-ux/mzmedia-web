import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { POST_TYPE_LABEL } from "@/lib/job-categories";
import { findJobById, formatJobDate, getJobById } from "@/lib/jobs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await findJobById(id);
    if (!post) return { title: "공고" };
    return {
      title: post.title,
      description: post.content.slice(0, 120),
    };
  } catch {
    return { title: "공고" };
  }
}

export default async function JobDetailPage({ params }: Params) {
  const { id } = await params;

  let post: Awaited<ReturnType<typeof getJobById>> = null;
  try {
    post = await getJobById(id);
  } catch {
    post = null;
  }

  if (!post) notFound();

  return (
    <>
      <PageHero
        eyebrow={POST_TYPE_LABEL[post.type]}
        title={post.title}
        description={`${post.category}${post.location ? ` · ${post.location}` : ""}`}
      />

      <section className="bg-white py-12 md:py-16">
        <div className="site-shell grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <article>
            <div className="flex flex-wrap gap-3 text-sm text-muted">
              <span>작성자 {post.author.name}</span>
              <span>·</span>
              <time dateTime={post.createdAt.toISOString()}>
                {formatJobDate(post.createdAt)}
              </time>
              <span>·</span>
              <span>조회 {post.views}</span>
            </div>

            <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-ink-soft">
              {post.content}
            </div>

            <div className="mt-10">
              <Link
                href={`/jobs?type=${post.type}`}
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink-soft"
              >
                목록으로
              </Link>
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-xl font-bold text-ink">공고 정보</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-muted">유형</dt>
                <dd className="mt-1 font-medium text-ink">
                  {POST_TYPE_LABEL[post.type]}
                </dd>
              </div>
              <div>
                <dt className="text-muted">카테고리</dt>
                <dd className="mt-1 font-medium text-ink">{post.category}</dd>
              </div>
              {post.location && (
                <div>
                  <dt className="text-muted">지역</dt>
                  <dd className="mt-1 font-medium text-ink">{post.location}</dd>
                </div>
              )}
              {post.budget && (
                <div>
                  <dt className="text-muted">예산</dt>
                  <dd className="mt-1 font-medium text-ink">{post.budget}</dd>
                </div>
              )}
              {post.contact && (
                <div>
                  <dt className="text-muted">연락처</dt>
                  <dd className="mt-1 break-all font-medium text-ink">
                    {post.contact}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
