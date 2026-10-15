import { redirect } from "next/navigation";
import { OsShell } from "@/components/os/OsShell";
import { getSessionStaff } from "@/lib/staff-auth";

export default async function OsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  return <OsShell staff={staff}>{children}</OsShell>;
}
