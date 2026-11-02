import { NextResponse } from "next/server";
import { decideImprovement, improvements } from "@/lib/office/engine";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await guardOffice();
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (body?.action !== "approve" && body?.action !== "reject") {
    return NextResponse.json({ error: "승인 또는 거절만 할 수 있습니다." }, { status: 400 });
  }
  try {
    await decideImprovement(id, body.action);
    return NextResponse.json(await improvements());
  } catch (error) {
    const message = error instanceof Error ? error.message : "처리하지 못했습니다.";
    const status = message.includes("찾을 수 없") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
