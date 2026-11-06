import { NextResponse } from "next/server";
import { listInquiries, saveReply } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function blocked() {
  return process.env.NODE_ENV !== "development";
}

export async function GET() {
  if (blocked()) return NextResponse.json({ error: "로컬에서만 엽니다." }, { status: 404 });
  const rows = await listInquiries();
  return NextResponse.json({
    inquiries: rows.map((row) => ({
      id: row.id,
      companyName: row.companyName,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      question: row.question,
      message: row.message,
      reply: row.reply,
      createdAt: row.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  if (blocked()) return NextResponse.json({ error: "로컬에서만 엽니다." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { id?: string; reply?: string } | null;
  const id = body?.id?.trim() ?? "";
  const reply = body?.reply?.trim() ?? "";
  if (!id || reply.length < 2) {
    return NextResponse.json({ error: "답변을 적어 주세요." }, { status: 400 });
  }
  const row = await saveReply(id, reply);
  if (!row) return NextResponse.json({ error: "문의를 찾지 못했습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
