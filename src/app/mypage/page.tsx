import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyInquiries } from "@/components/home/MyInquiries";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "1:1 문의 접수와 답변을 확인합니다.",
};

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  const user = await getSessionUser();
  const { question = "" } = await searchParams;
  const query = question.trim() ? `?question=${encodeURIComponent(question.trim())}` : "";
  if (!user) redirect(`/auth/signup?next=${encodeURIComponent(`/mypage${query}`)}`);

  return (
    <section className="bg-paper py-12 md:py-16">
      <div className="site-shell max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent">MY PAGE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">1:1 문의</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {user.name}님의 문의입니다. 대표가 답하면 이 화면에 표시됩니다. 문자나 이메일로 자동 발송하지 않습니다.
        </p>
        <MyInquiries question={question.trim()} />
      </div>
    </section>
  );
}
