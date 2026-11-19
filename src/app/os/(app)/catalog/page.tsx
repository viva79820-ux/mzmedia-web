import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductAdminBoard } from "@/components/ProductAdminBoard";
import { canSeeAmounts } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "상품 카탈로그",
  robots: { index: false, follow: false },
};

export default async function OsCatalogPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!canSeeAmounts(staff)) redirect("/os/calendar");
  return <ProductAdminBoard />;
}
