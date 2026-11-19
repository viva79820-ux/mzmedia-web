import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentsBoard } from "@/components/os/PaymentsBoard";
import { canSeeAmounts } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "매출·입금",
  robots: { index: false, follow: false },
};

export default async function OsPaymentsPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!canSeeAmounts(staff)) redirect("/os/calendar");
  return <PaymentsBoard />;
}
