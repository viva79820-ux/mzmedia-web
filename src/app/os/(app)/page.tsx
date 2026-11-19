import { redirect } from "next/navigation";
import { homePath } from "@/lib/os";
import { getSessionStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function OsHomePage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  redirect(homePath(staff.role));
}
