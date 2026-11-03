import { NextResponse } from "next/server";
import { decideAgent } from "@/lib/office/agents";
import { guardOffice } from "@/lib/office/guard";
import { getSessionStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const denied = await guardOffice();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { decision?: string } | null;
  try {
    const actor = (await getSessionStaff())?.name || "대표";
    const agent = await decideAgent(id, body?.decision ?? "", actor);
    return NextResponse.json({ agent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "승인 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
