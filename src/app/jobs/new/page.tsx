import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { JobForm } from "@/components/JobForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "공고 등록",
  description: "작업의뢰 또는 업체홍보 공고를 등록합니다.",
};

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login?next=/jobs/new");
  }

  return (
    <>
      <PageHero
        eyebrow="New post"
        title="공고 등록"
        description={`${user.name}님, 작업의뢰 또는 업체홍보 내용을 등록해 주세요.`}
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-3xl">
          <JobForm />
        </div>
      </section>
    </>
  );
}
