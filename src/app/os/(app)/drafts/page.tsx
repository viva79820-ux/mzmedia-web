import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DraftBoard } from "@/components/os/DraftBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "문서 초안",
  robots: { index: false, follow: false },
};

export default async function DraftsPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role !== "SUPER_ADMIN" && staff.role !== "MANAGER") redirect("/os/calendar");
  return <DraftBoard />;
}
