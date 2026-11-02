import { NextResponse } from "next/server";
import { listRecent, startJob } from "@/lib/office/engine";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  return NextResponse.json({ jobs: await listRecent() });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { goal?: string; run?: boolean } | null;
  try {
    const detail = await startJob(body?.goal ?? "", body?.run !== false);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "작업을 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
