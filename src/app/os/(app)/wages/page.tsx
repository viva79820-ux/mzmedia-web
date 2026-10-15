import type { Metadata } from "next";
import { WageBoard } from "@/components/WageBoard";
import { koreaToday } from "@/lib/wages";

export const metadata: Metadata = {
  title: "급여",
  robots: { index: false, follow: false },
};

export default function OsWagesPage() {
  const today = koreaToday();
  return <WageBoard initialYear={today.year} initialMonth={today.month} />;
}
