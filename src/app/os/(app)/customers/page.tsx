import type { Metadata } from "next";
import { CustomersBoard } from "@/components/os/CustomersBoard";

export const metadata: Metadata = {
  title: "고객관리",
  robots: { index: false, follow: false },
};

export default function OsCustomersPage() {
  return <CustomersBoard />;
}
