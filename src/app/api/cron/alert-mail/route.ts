import { NextResponse } from "next/server";
import { sendDueAlertMail } from "@/lib/send-due-mail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await sendDueAlertMail();
  return NextResponse.json({ ok: true, sent: result.sent });
}
