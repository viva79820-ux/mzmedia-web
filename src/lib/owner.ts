export const OWNER_EMAIL = "mzm79820@mzmedia.co.kr";

export function isOwnerAccount(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase() === OWNER_EMAIL;
}
