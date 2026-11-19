import { importPKCS8, SignJWT } from "jose";
import { prisma } from "@/lib/db";
import { ALERT_MAIL_TITLES, mailContent } from "@/lib/alert-mail";

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
let cached: { token: string; expiresAt: number } | null = null;

export function mailReady() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() &&
      process.env.GOOGLE_WORKSPACE_IMPERSONATE?.trim().toLowerCase().endsWith("@mzmedia.co.kr"),
  );
}

async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sender = process.env.GOOGLE_WORKSPACE_IMPERSONATE?.trim();
  if (!email || !key || !sender) return "";
  const privateKey = await importPKCS8(key, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email)
    .setSubject(sender)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("50m");
  const signed = await assertion.sign(privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signed,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!response.ok || !payload.access_token) return "";
  cached = { token: payload.access_token, expiresAt: Date.now() + (payload.expires_in ?? 3000) * 1000 };
  return payload.access_token;
}

function rawMessage(input: { from: string; to: string; subject: string; text: string }) {
  const mime = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.text,
  ].join("\r\n");
  return Buffer.from(mime).toString("base64url");
}

async function sendWorkspaceMail(input: { to: string; subject: string; text: string }) {
  const from = process.env.GOOGLE_WORKSPACE_IMPERSONATE?.trim() ?? "";
  const token = await accessToken();
  if (!token || !from) return false;
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ raw: rawMessage({ from, to: input.to, subject: input.subject, text: input.text }) }),
  });
  return response.ok;
}

export async function sendDueAlertMail(now = new Date()) {
  if (!mailReady()) return { sent: 0 };
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000);
  const origin = process.env.OFFICE_ORIGIN?.trim() || "https://www.mzmedia.co.kr";
  const rows = await prisma.osNotification.findMany({
    where: {
      readAt: null,
      emailSentAt: null,
      createdAt: { lte: cutoff },
      title: { in: [...ALERT_MAIL_TITLES] },
      staff: { active: true, email: { endsWith: "@mzmedia.co.kr" } },
    },
    include: { staff: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  let sent = 0;
  for (const row of rows) {
    const email = row.staff?.email ?? "";
    if (!email.endsWith("@mzmedia.co.kr")) continue;
    const claimed = await prisma.osNotification.updateMany({
      where: { id: row.id, readAt: null, emailSentAt: null },
      data: { emailSentAt: now },
    });
    if (claimed.count !== 1) continue;
    const content = mailContent({ title: row.title, body: row.body, href: row.href, origin });
    const ok = await sendWorkspaceMail({ to: email, subject: content.subject, text: content.text });
    if (!ok) {
      await prisma.osNotification.update({ where: { id: row.id }, data: { emailSentAt: null } });
      continue;
    }
    sent += 1;
  }
  return { sent };
}
