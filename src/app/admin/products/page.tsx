import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { ProductAdminBoard } from "@/components/ProductAdminBoard";
import { isAdminAuthed } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "상품 관리",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }

  return (
    <section className="bg-paper py-8 md:py-10">
      <div className="site-shell space-y-4">
        <AdminNav />
        <ProductAdminBoard />
      </div>
    </section>
  );
}
