import type { Metadata } from "next";
import { OrderAdminBoard } from "@/components/OrderAdminBoard";

export const metadata: Metadata = {
  title: "레거시 오더",
  robots: { index: false, follow: false },
};

export default function OsLegacyOrdersPage() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        기존 오더 CRM입니다. 신규 영업은 리드·프로젝트로 관리하세요.
      </p>
      <OrderAdminBoard />
    </div>
  );
}
