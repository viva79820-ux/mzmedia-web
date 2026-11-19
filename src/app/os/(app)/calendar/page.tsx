import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarBoard } from "@/components/os/CalendarBoard";

export const metadata: Metadata = {
  title: "생산 달력",
  robots: { index: false, follow: false },
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">달력을 불러오는 중</p>}>
      <CalendarBoard />
    </Suspense>
  );
}
