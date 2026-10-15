import type { Metadata } from "next";
import { ReportsBoard } from "@/components/os/ReportsBoard";

export const metadata: Metadata = {
  title: "경영 리포트",
  robots: { index: false, follow: false },
};

export default function OsReportsPage() {
  return <ReportsBoard />;
}
