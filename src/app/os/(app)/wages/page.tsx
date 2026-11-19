import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WageBoard } from "@/components/WageBoard";
import { canSeeAmounts } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";
import { koreaToday } from "@/lib/wages";

export const metadata: Metadata = {
  title: "급여명세서",
  robots: { index: false, follow: false },
};

export default async function OsWagesPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!canSeeAmounts(staff)) redirect("/os/calendar");
  const today = koreaToday();
  return <WageBoard initialYear={today.year} initialMonth={today.month} />;
}
