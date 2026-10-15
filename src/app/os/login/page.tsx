import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OsLoginForm } from "@/components/os/OsLoginForm";
import { getSessionStaff } from "@/lib/staff-auth";
import { ensureSuperAdminSeeded } from "@/lib/os-seed";

export const metadata: Metadata = {
  title: "OS 로그인",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OsLoginPage() {
  try {
    await ensureSuperAdminSeeded();
  } catch {
    // env missing — form will show error on login
  }
  const staff = await getSessionStaff();
  if (staff) redirect("/os");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef1f6] px-4">
      <Suspense fallback={<div className="text-sm text-muted">로딩...</div>}>
        <OsLoginForm />
      </Suspense>
    </div>
  );
}
