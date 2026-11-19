import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthed } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (await isAdminAuthed()) {
    redirect("/os");
  }

  return (
    <>
      <PageHero
        eyebrow="Admin"
        title="관리자"
        description="관리자 비밀번호 다음은 직원 로그인입니다. 대표는 팀 달력, PM은 수신함, 생산팀은 내 달력이 열립니다."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-md">
          <AdminLoginForm />
        </div>
      </section>
    </>
  );
}
