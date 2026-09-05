"use client";

import { useMemo, useState } from "react";
import { EstimateWidget } from "@/components/EstimateWidget";
import { ServiceInquiryForm } from "@/components/ServiceInquiryForm";
import type { EstimateRule, SaleMode } from "@/lib/catalog";

export type EstimateProductOption = {
  id: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  saleMode: SaleMode;
  rule: EstimateRule;
};

type Props = {
  products: EstimateProductOption[];
};

export function QuickEstimateClient({ products }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  return (
    <div className="space-y-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">서비스 선택</span>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              [{product.categoryName}] {product.name}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <EstimateWidget
          productId={selected.id}
          productName={selected.name}
          saleMode={selected.saleMode}
          rule={selected.rule}
        />
      ) : (
        <div className="rounded-[1.5rem] border border-line bg-white p-6">
          <p className="text-sm text-muted">
            등록된 상품이 없습니다. 일반 문의로 남겨 주세요.
          </p>
          <ServiceInquiryForm />
        </div>
      )}
    </div>
  );
}
