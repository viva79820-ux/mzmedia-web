"use client";

import { useState } from "react";
import { OrderAdminBoard } from "@/components/OrderAdminBoard";

export function LegacyOrdersPanel() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function migrate() {
    if (
      !window.confirm(
        "레거시 오더를 고객·리드로 이관할까요? (이미 이관된 건은 건너뜁니다)",
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/os/legacy/migrate-orders", {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        created?: number;
        skipped?: number;
        total?: number;
      };
      if (!res.ok || !data.ok) {
        setMessage("이관에 실패했습니다.");
        return;
      }
      setMessage(
        `이관 완료: 신규 ${data.created}건 / 건너뜀 ${data.skipped}건 / 전체 ${data.total}건`,
      );
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-4">
        <h1 className="text-xl font-bold text-ink">레거시 오더</h1>
        <p className="mt-1 text-sm text-muted">
          신규 영업은 리드·견적·계약으로 관리하세요. 필요 시 기존 오더를
          고객/리드로 일괄 이관할 수 있습니다.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={migrate}
          className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "이관 중..." : "오더 → 리드 이관 실행"}
        </button>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      </div>
      <OrderAdminBoard />
    </div>
  );
}
