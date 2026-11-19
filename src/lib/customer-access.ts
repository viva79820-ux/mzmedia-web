export function responsiblePmIds(input: { pmId?: string | null; leadOwnerIds?: Array<string | null> }) {
  if (input.pmId) return [input.pmId];
  const ids = new Set<string>();
  for (const id of input.leadOwnerIds ?? []) {
    if (id) ids.add(id);
  }
  return [...ids];
}

export function canOpenCustomer(role: string, staffId: string, pmIds: string[]) {
  if (role === "SUPER_ADMIN") return true;
  if (role === "MANAGER") return pmIds.includes(staffId);
  return false;
}

const CLOSED = new Set(["완료", "대표확인"]);

export function openWork<T extends { status: string }>(slots: T[]) {
  return slots.filter((slot) => !CLOSED.has(slot.status));
}

export function scopeItems<T extends { kind: string }>(items: T[]) {
  return {
    inScope: items.filter((item) => item.kind === "업무"),
    outside: items.filter((item) => item.kind === "확인필요"),
  };
}
