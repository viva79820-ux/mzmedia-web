import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MoneyBoard } from "@/components/os/MoneyBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "금액",
  robots: { index: false, follow: false },
};

export default async function MoneyPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role === "EMPLOYEE" || staff.role === "FREELANCER") redirect("/os/calendar");
  return <MoneyBoard />;
}
