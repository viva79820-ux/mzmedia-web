import type { Metadata } from "next";
import { Suspense } from "react";
import { OsLoginForm } from "@/components/os/OsLoginForm";

export const metadata: Metadata = {
  title: "직원 로그인",
  robots: { index: false, follow: false },
};

export default function OsLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4">
      <Suspense fallback={<p className="text-sm text-muted">로그인 화면을 준비하는 중</p>}>
        <OsLoginForm />
      </Suspense>
    </main>
  );
}
