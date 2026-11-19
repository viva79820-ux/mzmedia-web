import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InboxBoard } from "@/components/os/InboxBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "수신함",
  robots: { index: false, follow: false },
};

export default async function InboxPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role !== "SUPER_ADMIN" && staff.role !== "MANAGER") redirect("/os/calendar");
  return <InboxBoard />;
}
