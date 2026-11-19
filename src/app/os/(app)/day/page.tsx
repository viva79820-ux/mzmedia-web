import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DayBoard } from "@/components/os/DayBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "하루",
  robots: { index: false, follow: false },
};

export default async function DayPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (staff.role === "ACCOUNTING") redirect("/os/money");
  return (
    <Suspense fallback={<p className="text-sm text-muted">하루 일정을 불러오는 중</p>}>
      <DayBoard />
    </Suspense>
  );
}
