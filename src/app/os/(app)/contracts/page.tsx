import type { Metadata } from "next";
import { ContractsBoard } from "@/components/os/ContractsBoard";

export const metadata: Metadata = {
  title: "계약 관리",
  robots: { index: false, follow: false },
};

export default function OsContractsPage() {
  return <ContractsBoard />;
}
