import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "직원 계정 도움말",
  robots: { index: false, follow: false },
};

export default async function StaffAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string | string[] }>;
}) {
  const recovery = (await searchParams).request === "recovery";
  const title = recovery ? "아이디·비밀번호 찾기" : "직원 계정 발급";
  const description = recovery
    ? "회사 관리자에게 아이디 확인 또는 비밀번호 재설정을 요청해 주세요. 현재 비밀번호는 보내지 마세요."
    : "회사 관리자에게 직원 계정 발급을 요청해 주세요. 계정을 발급받으면 ERP에 로그인할 수 있습니다.";

  return (
    <>
      <PageHero eyebrow="ERP" title={title} description={description} />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-md">
          <div className="rounded-[1.75rem] border border-line bg-white p-6 md:p-8">
            <Link
              href="/admin"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
