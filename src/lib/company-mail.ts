export const COMPANY_DOMAIN = "mzmedia.co.kr";

const ROLE_ONLY = new Set([
  "pm",
  "am",
  "admin",
  "ceo",
  "info",
  "contact",
  "staff",
  "office",
  "mail",
  "support",
]);

export function parseCompanyEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  const suffix = `@${COMPANY_DOMAIN}`;
  const local = trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed;
  if (!local) return { ok: false as const, error: "회사 메일 주소를 입력해 주세요." };
  if (trimmed.includes("@") && !trimmed.endsWith(suffix)) {
    return { ok: false as const, error: "회사 메일은 @mzmedia.co.kr 만 쓸 수 있습니다." };
  }
  if (local.includes("@")) {
    return { ok: false as const, error: "회사 메일은 @mzmedia.co.kr 만 쓸 수 있습니다." };
  }
  if (ROLE_ONLY.has(local)) {
    return { ok: false as const, error: "사람마다 구분되는 주소를 쓰세요. 역할 이름만 있는 주소는 쓰지 않습니다." };
  }
  if (!/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(local) || local.includes("..")) {
    return { ok: false as const, error: "주소는 영문 소문자, 숫자, 점, 밑줄, 하이픈만 쓸 수 있습니다." };
  }
  return { ok: true as const, email: `${local}@${COMPANY_DOMAIN}` };
}
