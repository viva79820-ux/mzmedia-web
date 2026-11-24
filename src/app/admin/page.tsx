import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { LoginForm } from "@/components/LoginForm";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (await getSessionStaff()) redirect("/os");

  return (
    <>
      <PageHero
        eyebrow="Login"
        title="로그인"
        description="ERP를 이용하려면 회사에서 발급한 직원 계정으로 로그인해 주세요."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-md">
          <Suspense fallback={<div className="text-sm text-muted">불러오는 중…</div>}>
            <LoginForm staff />
          </Suspense>
        </div>
      </section>
    </>
  );
}
