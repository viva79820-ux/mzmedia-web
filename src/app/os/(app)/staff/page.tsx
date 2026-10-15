import type { Metadata } from "next";
import { StaffBoard } from "@/components/os/StaffBoard";

export const metadata: Metadata = {
  title: "직원 관리",
  robots: { index: false, follow: false },
};

export default function OsStaffPage() {
  return <StaffBoard />;
}
