"use client";

import { useMemo, useState } from "react";
import {
  calculateEstimate,
  formatPriceLabel,
  type EstimateRule,
  type EstimateSelection,
  type SaleMode,
} from "@/lib/catalog";
import { ServiceInquiryForm } from "@/components/ServiceInquiryForm";

type Props = {
  productId: string;
  productName: string;
  saleMode: SaleMode;
  rule: EstimateRule;
};

export function EstimateWidget({
  productId,
  productName,
  saleMode,
  rule,
}: Props) {
  const initial = useMemo(() => {
    const sel: EstimateSelection = {};
    for (const option of rule.options) {
      if (option.defaultValue !== undefined) sel[option.id] = option.defaultValue;
    }
    return sel;
  }, [rule.options]);

  const [selection, setSelection] = useState<EstimateSelection>(initial);
  const result = calculateEstimate(rule, saleMode, selection);

  return (
    <div className="space-y-6 rounded-[1.5rem] border border-line bg-white p-5 md:p-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
          Estimate
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">
          예상 견적
        </h2>
        <p className="mt-2 text-sm text-muted">
          {saleMode === "CONSULT"
            ? "상담 견적 상품입니다. 요구사항을 남겨 주시면 확인 후 연락드립니다."
            : "옵션을 선택하면 예상 금액을 확인할 수 있습니다."}
        </p>
      </div>

      {rule.options.length > 0 && (
        <div className="grid gap-3">
          {rule.options.map((option) => (
            <label key={option.id} className="block text-sm">
              <span className="mb-1 block font-medium text-ink">
                {option.label}
              </span>
              {option.type === "number" ? (
                <input
                  type="number"
                  min={option.min}
                  max={option.max}
                  step={option.step ?? 1}
                  value={Number(selection[option.id] ?? 0)}
                  onChange={(e) =>
                    setSelection((prev) => ({
                      ...prev,
                      [option.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
                />
              ) : option.type === "boolean" ? (
                <input
                  type="checkbox"
                  checked={Boolean(selection[option.id])}
                  onChange={(e) =>
                    setSelection((prev) => ({
                      ...prev,
                      [option.id]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              ) : (
                <select
                  value={String(selection[option.id] ?? "")}
                  onChange={(e) =>
                    setSelection((prev) => ({
                      ...prev,
                      [option.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2.5"
                >
                  {(option.choices ?? []).map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-paper p-4">
        <p className="text-sm text-muted">선택한 상품</p>
        <p className="mt-1 font-semibold text-ink">{productName}</p>
        <p className="mt-4 text-sm text-muted">예상 제작비</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">
          {result.consultOnly
            ? "상담 후 확정"
            : formatPriceLabel(result.total)}
        </p>
        <p className="mt-2 text-sm text-muted">
          예상 제작기간: {result.durationLabel || "상담 후 확정"}
        </p>
        <p className="mt-1 text-sm text-muted">
          VAT: {result.vatIncluded ? "포함 기준 안내" : "별도 안내"}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">{result.note}</p>
      </div>

      <ServiceInquiryForm
        productId={productId}
        productName={productName}
        selection={selection}
        estimateSummary={
          result.consultOnly
            ? "상담 후 확정"
            : formatPriceLabel(result.total)
        }
      />
    </div>
  );
}
