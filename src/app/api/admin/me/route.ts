import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const ok = await isAdminAuthed();
  return NextResponse.json({ ok });
}
