export type SaleMode = "FIXED" | "AUTO" | "CONSULT";

export const SALE_MODE_LABEL: Record<SaleMode, string> = {
  FIXED: "정찰제",
  AUTO: "자동견적",
  CONSULT: "상담견적",
};

export type EstimateOptionChoice = {
  label: string;
  value: string;
  priceAdd?: number;
  multiplier?: number;
  durationHint?: string;
};

export type EstimateOption = {
  id: string;
  label: string;
  type: "number" | "select" | "boolean";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number | string | boolean;
  choices?: EstimateOptionChoice[];
  priceAdd?: number;
  pricePerUnit?: number;
};

export type EstimateRule = {
  basePrice: number | null;
  vatIncluded: boolean;
  durationLabel: string | null;
  options: EstimateOption[];
};

export type FaqItem = { q: string; a: string };

export function emptyEstimateRule(): EstimateRule {
  return {
    basePrice: null,
    vatIncluded: true,
    durationLabel: null,
    options: [],
  };
}

export function parseEstimateRule(value: unknown): EstimateRule {
  if (!value || typeof value !== "object") return emptyEstimateRule();
  const raw = value as Record<string, unknown>;
  const options = Array.isArray(raw.options) ? (raw.options as EstimateOption[]) : [];
  return {
    basePrice:
      typeof raw.basePrice === "number"
        ? raw.basePrice
        : raw.basePrice === null
          ? null
          : null,
    vatIncluded: Boolean(raw.vatIncluded ?? true),
    durationLabel:
      typeof raw.durationLabel === "string" ? raw.durationLabel : null,
    options,
  };
}

export function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.q !== "string" || typeof row.a !== "string") return null;
      return { q: row.q, a: row.a };
    })
    .filter((item): item is FaqItem => item !== null);
}

export function formatPriceLabel(price: number | null | undefined) {
  if (price === null || price === undefined) return "상담 후 확정";
  return `${price.toLocaleString("ko-KR")}원~`;
}

export type EstimateSelection = Record<string, number | string | boolean>;

export type EstimateResult = {
  ok: boolean;
  consultOnly: boolean;
  basePrice: number | null;
  total: number | null;
  vatIncluded: boolean;
  durationLabel: string | null;
  lines: { label: string; value: string; amount: number | null }[];
  note: string;
};

export function calculateEstimate(
  rule: EstimateRule,
  saleMode: SaleMode,
  selection: EstimateSelection,
): EstimateResult {
  const note =
    "표시된 금액은 예상 견적이며, 최종 견적은 상담 후 확정됩니다.";

  if (saleMode === "CONSULT" || rule.basePrice === null) {
    return {
      ok: true,
      consultOnly: true,
      basePrice: null,
      total: null,
      vatIncluded: rule.vatIncluded,
      durationLabel: rule.durationLabel,
      lines: [],
      note,
    };
  }

  let total = rule.basePrice;
  let multiplier = 1;
  const lines: EstimateResult["lines"] = [
    {
      label: "기본가",
      value: formatPriceLabel(rule.basePrice),
      amount: rule.basePrice,
    },
  ];

  for (const option of rule.options) {
    const raw = selection[option.id] ?? option.defaultValue;
    if (option.type === "number") {
      const qty = Number(raw ?? 0) || 0;
      const add = (option.pricePerUnit ?? 0) * qty;
      total += add;
      lines.push({
        label: option.label,
        value: `${qty}${option.unit ? ` ${option.unit}` : ""}`,
        amount: add || null,
      });
    } else if (option.type === "boolean") {
      const on = Boolean(raw);
      const add = on ? (option.priceAdd ?? 0) : 0;
      total += add;
      lines.push({
        label: option.label,
        value: on ? "선택" : "미선택",
        amount: add || null,
      });
    } else if (option.type === "select") {
      const value = String(raw ?? "");
      const choice = option.choices?.find((c) => c.value === value);
      const add = choice?.priceAdd ?? 0;
      if (choice?.multiplier && choice.multiplier > 0) {
        multiplier *= choice.multiplier;
      }
      total += add;
      lines.push({
        label: option.label,
        value: choice?.label ?? value,
        amount: add || null,
      });
    }
  }

  total = Math.round(total * multiplier);

  return {
    ok: true,
    consultOnly: false,
    basePrice: rule.basePrice,
    total,
    vatIncluded: rule.vatIncluded,
    durationLabel: rule.durationLabel,
    lines,
    note,
  };
}
