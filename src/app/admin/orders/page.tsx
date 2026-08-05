import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderAdminBoard } from "@/components/OrderAdminBoard";
import { isAdminAuthed } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "오더 DB 관리",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }

  return (
    <section className="bg-paper py-8 md:py-10">
      <div className="site-shell">
        <OrderAdminBoard />
      </div>
    </section>
  );
}
