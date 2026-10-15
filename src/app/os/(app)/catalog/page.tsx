import type { Metadata } from "next";
import { ProductAdminBoard } from "@/components/ProductAdminBoard";

export const metadata: Metadata = {
  title: "상품 카탈로그",
  robots: { index: false, follow: false },
};

export default function OsCatalogPage() {
  return <ProductAdminBoard />;
}
