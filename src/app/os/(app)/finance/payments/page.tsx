import type { Metadata } from "next";
import { PaymentsBoard } from "@/components/os/PaymentsBoard";

export const metadata: Metadata = {
  title: "매출·입금",
  robots: { index: false, follow: false },
};

export default function OsPaymentsPage() {
  return <PaymentsBoard />;
}
