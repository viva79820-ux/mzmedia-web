import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { WageBoard } from "@/components/WageBoard";
import { isAdminAuthed } from "@/lib/admin-auth";
import { koreaToday } from "@/lib/wages";

export const metadata: Metadata = {
  title: "직원 급여 산정",
  robots: { index: false, follow: false },
};

export default async function AdminWagesPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }

  const today = koreaToday();

  return (
    <section className="bg-paper py-8 md:py-10">
      <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))] space-y-4">
        <AdminNav />
        <WageBoard initialYear={today.year} initialMonth={today.month} />
      </div>
    </section>
  );
}
