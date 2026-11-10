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
    redirect("/office/erp");
  }

  return (
    <>
      <PageHero
        eyebrow="Admin"
        title="관리자"
        description="관리자 비밀번호로 들어가면 대시보드, 수금·미수, 지출을 볼 수 있습니다."
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell mx-auto max-w-md">
          <AdminLoginForm />
        </div>
      </section>
    </>
  );
}
