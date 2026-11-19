import type { Metadata } from "next";
import { OsSignupForm } from "@/components/os/OsSignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: false },
};

export default function OsSignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4">
      <OsSignupForm />
    </main>
  );
}
