import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { inquiryStatus, listInquiries, saveReply } from "@/lib/home/store";

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
  const rows = await listInquiries();
  return NextResponse.json({
    inquiries: rows.map((row) => ({
      ...row,
      status: inquiryStatus(row),
    })),
  });
}

export async function POST(request: Request) {
  if (!(await allowed())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string; reply?: string } | null;
  const id = body?.id?.trim() ?? "";
  const reply = body?.reply?.trim() ?? "";
  if (!id || reply.length < 2) {
    return NextResponse.json({ error: "답변을 적어 주세요." }, { status: 400 });
  }
  const row = await saveReply(id, reply);
  if (!row) return NextResponse.json({ error: "문의를 찾지 못했습니다." }, { status: 404 });
  return NextResponse.json({ ok: true, status: inquiryStatus(row) });
}
