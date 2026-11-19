import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AskBoard } from "@/components/os/AskBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "AI 질문",
  robots: { index: false, follow: false },
};

export default async function AskPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"].includes(staff.role)) redirect("/os/calendar");
  return <AskBoard />;
}
