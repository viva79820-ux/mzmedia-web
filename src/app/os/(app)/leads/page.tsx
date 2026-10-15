import type { Metadata } from "next";
import { LeadsBoard } from "@/components/os/LeadsBoard";

export const metadata: Metadata = {
  title: "영업 Pipeline",
  robots: { index: false, follow: false },
};

export default function OsLeadsPage() {
  return <LeadsBoard />;
}
