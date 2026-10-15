import type { Metadata } from "next";
import { RecurringBoard } from "@/components/os/RecurringBoard";

export const metadata: Metadata = {
  title: "반복업무",
  robots: { index: false, follow: false },
};

export default function OsRecurringPage() {
  return <RecurringBoard />;
}
