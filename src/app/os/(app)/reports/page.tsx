import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportsBoard } from "@/components/os/ReportsBoard";
import { canSeeAmounts } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "경영 리포트",
  robots: { index: false, follow: false },
};

export default async function OsReportsPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!canSeeAmounts(staff)) redirect("/os/calendar");
  return <ReportsBoard />;
}
