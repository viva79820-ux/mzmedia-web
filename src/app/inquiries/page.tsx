import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InquiryComposer } from "@/components/home/InquiryComposer";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "1:1 문의",
  description: "로그인한 뒤 1:1 문의를 남깁니다.",
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  const { question = "" } = await searchParams;
  const trimmed = question.trim();
  const next = `/inquiries${trimmed ? `?question=${encodeURIComponent(trimmed)}` : ""}`;
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);

  return (
    <section className="bg-paper py-12 md:py-16">
      <div className="site-shell max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent">1:1</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">1:1 문의</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {user.name}님, 문의 내용을 보내면 마이페이지에서 접수 현황을 볼 수 있습니다.
        </p>
        <InquiryComposer question={trimmed} />
      </div>
    </section>
  );
}
