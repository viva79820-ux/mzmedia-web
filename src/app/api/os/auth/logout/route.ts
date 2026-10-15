import { NextResponse } from "next/server";
import { clearStaffCookie } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearStaffCookie();
  return NextResponse.json({ ok: true });
}
