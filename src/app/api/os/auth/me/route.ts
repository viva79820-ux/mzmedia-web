import { NextResponse } from "next/server";
import { getSessionStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET() {
  const staff = await getSessionStaff();
  if (!staff) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, staff });
}
