export const ALERT_MAIL_TITLES = ["프로젝트 대화", "업무 배정"] as const;
const WAIT_MS = 10 * 60 * 1000;

export function dueForMail(input: {
  title: string;
  readAt: Date | null;
  emailSentAt: Date | null;
  createdAt: Date;
  email: string;
  active: boolean;
  now: Date;
}) {
  if (!ALERT_MAIL_TITLES.includes(input.title as (typeof ALERT_MAIL_TITLES)[number])) return false;
  if (input.readAt || input.emailSentAt || !input.active) return false;
  if (!input.email.toLowerCase().endsWith("@mzmedia.co.kr")) return false;
  return input.now.getTime() - input.createdAt.getTime() >= WAIT_MS;
}

export function mailContent(input: { title: string; body: string; href: string; origin: string }) {
  const body = input.body
    .replace(/\d[\d,]*\s*원/g, "")
    .replace(/(단가|계약금액|견적 합계|미수금|급여|청구액|원가)[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const path = input.href.startsWith("/") ? input.href : "/os";
  const link = `${input.origin.replace(/\/$/, "")}${path}`;
  return { subject: input.title, text: [body, link].filter(Boolean).join("\n") };
}
