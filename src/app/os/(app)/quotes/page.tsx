import type { Metadata } from "next";
import { QuotesBoard } from "@/components/os/QuotesBoard";

export const metadata: Metadata = {
  title: "견적 관리",
  robots: { index: false, follow: false },
};

export default function OsQuotesPage() {
  return <QuotesBoard />;
}
