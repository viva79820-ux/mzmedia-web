const DRIVE_LINK = /https?:\/\/(?:drive|docs)\.google\.com\/[^\s)]+/g;

export function driveLinks(text: string) {
  return [...text.matchAll(DRIVE_LINK)].map((match) => match[0]);
}

export function hasMoney(text: string) {
  return /\d[\d,]*\s*원/.test(text) || /(단가|계약금액|견적 합계|미수금|급여)/.test(text);
}

export function chatPreview(customerName: string, text: string) {
  const plain = text
    .replace(DRIVE_LINK, "드라이브 링크")
    .replace(/\d[\d,]*\s*원/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${customerName} · ${plain}`;
}

export function otherRecipients(ids: string[], senderId: string) {
  return [...new Set(ids)].filter((id) => id && id !== senderId);
}
