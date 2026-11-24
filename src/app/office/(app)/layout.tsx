import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfficeFrame } from "@/components/office/OfficeFrame";
import { headers } from "next/headers";
import { canAccessOffice } from "@/lib/office/access";
import { getSessionStaff } from "@/lib/staff-auth";
import "../office.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "엠지 오피스",
  robots: { index: false, follow: false },
};

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const staff = await getSessionStaff();
  if (!staff) {
    const pathname = (await headers()).get("x-pathname") || "/office";
    redirect("/os/login?" + new URLSearchParams({ next: pathname }));
  }
  if (!canAccessOffice(staff.role)) redirect("/os");
  return <OfficeFrame>{children}</OfficeFrame>;
}
