import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { unsuitableStandard } from "@/lib/home/answer";
import { listAsks, promoteStandards, saveApprovedAsk } from "@/lib/home/asks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function allowed() {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await allowed())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const asks = await listAsks();
  return NextResponse.json({ asks });
}

export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string; approved?: string } | null;
  const id = body?.id?.trim() ?? "";
  const approved = body?.approved?.trim() ?? "";
  if (!id || approved.length < 2) {
    return NextResponse.json({ error: "다음 고객에게 보여줄 답을 적어 주세요." }, { status: 400 });
  }
  if (unsuitableStandard(approved)) {
    return NextResponse.json({ error: "금액, 월 수량, 다른 고객의 연락처나 매출은 표준 답에 넣지 않습니다." }, { status: 400 });
  }
  const row = await saveApprovedAsk(id, approved);
  await promoteStandards().catch(() => undefined);
  if (!row) return NextResponse.json({ error: "질문을 찾지 못했습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
