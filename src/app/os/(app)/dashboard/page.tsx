import type { Metadata } from "next";
import { DashboardBoard } from "@/components/os/DashboardBoard";

export const metadata: Metadata = {
  title: "OS 대시보드",
  robots: { index: false, follow: false },
};

export default function OsDashboardPage() {
  return <DashboardBoard />;
}
