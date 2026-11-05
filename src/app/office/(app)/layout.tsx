import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfficeFrame } from "@/components/office/OfficeFrame";
import { isAdminAuthed } from "@/lib/admin-auth";
import "../office.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "엠지몬",
  robots: { index: false, follow: false },
};

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthed())) redirect("/admin");
  return <OfficeFrame>{children}</OfficeFrame>;
}
