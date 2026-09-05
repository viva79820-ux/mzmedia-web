"use client";

import { useEffect, useState } from "react";

type Inquiry = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  serviceName: string;
  budgetLabel: string;
  dueDate: string;
  message: string;
  status: string;
  createdAt: string;
  product?: { name: string } | null;
};

export function InquiryAdminBoard() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { inquiries: Inquiry[] };
        setItems(data.inquiries);
      })
      .catch(() => setError("문의 목록을 불러오지 못했습니다."));
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
      <h1 className="font-display text-2xl font-bold text-ink">견적 문의</h1>
      <p className="mt-1 text-sm text-muted">
        고객이 남긴 견적 문의입니다. 상세는 오더 관리의 ‘견적서’ 상태에도
        동기화됩니다.
      </p>
      {error && <p className="mt-4 text-sm text-accent-deep">{error}</p>}
      <div className="mt-6 space-y-4">
        {items.length === 0 && !error ? (
          <p className="text-sm text-muted">아직 접수된 문의가 없습니다.</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-line bg-paper p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">
                    {item.serviceName || item.product?.name || "견적 문의"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {item.companyName} · {item.contactName}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {new Date(item.createdAt).toLocaleString("ko-KR")}
                </p>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {item.phone} / {item.email}
              </p>
              {item.budgetLabel && (
                <p className="mt-1 text-sm text-muted">예산: {item.budgetLabel}</p>
              )}
              {item.dueDate && (
                <p className="mt-1 text-sm text-muted">희망일: {item.dueDate}</p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">
                {item.message}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
