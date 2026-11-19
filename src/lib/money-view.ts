export type PaymentRow = {
  customerName: string;
  status: string;
};

export function receivableByCustomer(rows: PaymentRow[]) {
  const open = new Map<string, boolean>();
  for (const row of rows) {
    if (!row.customerName) continue;
    const unpaid = row.status === "PLANNED" || row.status === "OVERDUE";
    open.set(row.customerName, (open.get(row.customerName) ?? false) || unpaid);
  }
  return [...open.entries()]
    .map(([customerName, unpaid]) => ({
      customerName,
      receivable: unpaid ? "미수 있음" : "미수 없음",
    }))
    .sort((a, b) => a.customerName.localeCompare(b.customerName, "ko"));
}
