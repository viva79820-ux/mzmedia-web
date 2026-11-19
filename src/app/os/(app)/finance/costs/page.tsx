import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CostsBoard } from "@/components/os/CostsBoard";
import { canSeeAmounts } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "비용·원가",
  robots: { index: false, follow: false },
};

export default async function OsCostsPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!canSeeAmounts(staff)) redirect("/os/calendar");
  return <CostsBoard />;
}
