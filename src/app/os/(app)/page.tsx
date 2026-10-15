import { redirect } from "next/navigation";
import { getSessionStaff } from "@/lib/staff-auth";
import { isManagerPlus } from "@/lib/os";

export const dynamic = "force-dynamic";

export default async function OsHomePage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (isManagerPlus(staff.role) || staff.role === "ACCOUNTING") {
    redirect("/os/dashboard");
  }
  redirect("/os/tasks");
}
