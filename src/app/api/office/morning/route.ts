import { NextResponse } from "next/server";
import { guardOffice } from "@/lib/office/guard";
import { morningBoard } from "@/lib/office/morning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  return NextResponse.json(await morningBoard());
}
