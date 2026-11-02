import { NextResponse } from "next/server";
import { summary } from "@/lib/office/engine";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  return NextResponse.json(await summary());
}
