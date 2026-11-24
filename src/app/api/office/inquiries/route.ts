import { NextResponse } from "next/server";
import { guardOffice } from "@/lib/office/guard";
import { inquiryStatus, listInquiries, saveReply } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
  const denied = await guardOffice({ prepareSchema: false });
  if (denied) return denied;
  const rows = await listInquiries();
  return NextResponse.json({
    inquiries: rows.map((row) => ({
      ...row,
      status: inquiryStatus(row),
    })),
  });
}

export async function POST(request: Request) {
  const denied = await guardOffice({ prepareSchema: false });
  if (denied) return denied;
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
