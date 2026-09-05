import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { InquiryAdminBoard } from "@/components/InquiryAdminBoard";
import { isAdminAuthed } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "견적 문의 관리",
  robots: { index: false, follow: false },
};

export default async function AdminInquiriesPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }

  return (
    <section className="bg-paper py-8 md:py-10">
      <div className="site-shell space-y-4">
        <AdminNav />
        <InquiryAdminBoard />
      </div>
    </section>
  );
}
