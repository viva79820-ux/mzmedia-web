import type { Metadata } from "next";
import { CostsBoard } from "@/components/os/CostsBoard";

export const metadata: Metadata = {
  title: "비용·원가",
  robots: { index: false, follow: false },
};

export default function OsCostsPage() {
  return <CostsBoard />;
}
