import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomersBoard } from "@/components/os/CustomersBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "고객사",
  robots: { index: false, follow: false },
};

export default async function OsCustomersPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role !== "SUPER_ADMIN" && staff.role !== "MANAGER") redirect("/os/calendar");
  return <CustomersBoard />;
}
