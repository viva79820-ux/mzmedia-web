import type { Metadata } from "next";
import { LegacyOrdersPanel } from "@/components/os/LegacyOrdersPanel";

export const metadata: Metadata = {
  title: "레거시 오더",
  robots: { index: false, follow: false },
};

export default function OsLegacyOrdersPage() {
  return <LegacyOrdersPanel />;
}
