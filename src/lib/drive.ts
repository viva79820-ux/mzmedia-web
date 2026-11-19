import { importPKCS8, SignJWT } from "jose";

const SCOPE = "https://www.googleapis.com/auth/drive";

let cached: { token: string; expiresAt: number } | null = null;

export function driveFolderId(value: string) {
  const text = value.trim();
  const folder = text.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folder) return folder[1];
  const id = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (id) return id[1];
  return /^[a-zA-Z0-9_-]{10,}$/.test(text) ? text : "";
}

export function driveFileId(value: string) {
  const file = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return file?.[1] ?? "";
}

export function driveReady() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim());
}

async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return "";
  const privateKey = await importPKCS8(key, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("50m");
  const impersonate = process.env.GOOGLE_WORKSPACE_IMPERSONATE?.trim();
  if (impersonate) assertion.setSubject(impersonate);
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

export async function uploadDriveText(input: { folderUrl: string; name: string; body: string; fileId?: string }) {
  const folderId = driveFolderId(input.folderUrl);
  if (!folderId) return { ok: false as const, error: "고객사 드라이브 폴더 주소를 확인해 주세요." };
  const token = await accessToken();
  if (!token) return { ok: false as const, error: "드라이브에 파일을 만들지 못했습니다. 워크스페이스 연결이 없습니다." };

  if (input.fileId) {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${input.fileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "content-type": "text/plain; charset=utf-8" },
        body: input.body,
      },
    );
    if (!response.ok) return { ok: false as const, error: "드라이브 파일을 고치지 못했습니다." };
    return { ok: true as const, id: input.fileId, url: `https://docs.google.com/document/d/${input.fileId}/edit` };
  }

  const boundary = `mz${Date.now()}`;
  const meta = JSON.stringify({
    name: input.name,
    mimeType: "application/vnd.google-apps.document",
    parents: [folderId],
  });
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    meta,
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const payload = (await response.json()) as { id?: string };
  if (!response.ok || !payload.id) return { ok: false as const, error: "드라이브에 파일을 만들지 못했습니다." };
  return { ok: true as const, id: payload.id, url: `https://docs.google.com/document/d/${payload.id}/edit` };
}

export async function shareDriveFile(fileId: string, email: string) {
  if (!fileId || !email.endsWith("@mzmedia.co.kr")) return;
  const token = await accessToken();
  if (!token) return;
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ role: "writer", type: "user", emailAddress: email }),
  });
}

export async function readDriveText(url: string) {
  const fileId = driveFileId(url);
  if (!fileId || !driveReady()) return "";
  const token = await accessToken();
  if (!token) return "";
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&supportsAllDrives=true`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return "";
  const text = await response.text();
  return text.replace(/\s+/g, " ").trim().slice(0, 1500);
}
