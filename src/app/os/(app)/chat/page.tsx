import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChatBoard } from "@/components/os/ChatBoard";
import { getSessionStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "프로젝트 대화",
  robots: { index: false, follow: false },
};

export default async function ChatPage() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/os/login");
  if (!["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"].includes(staff.role)) redirect("/os/calendar");
  return (
    <Suspense fallback={<p className="text-sm text-muted">대화방을 불러오는 중</p>}>
      <ChatBoard />
    </Suspense>
  );
}
