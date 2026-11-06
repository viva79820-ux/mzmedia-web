import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { memberById } from "@/lib/home/members";
import { addInquiry, inquiryStatus, listMyInquiries } from "@/lib/home/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function customerView(row: Awaited<ReturnType<typeof listMyInquiries>>[number]) {
  return {
    id: row.id,
    companyName: row.companyName,
    question: row.question,
    message: row.message,
    reply: row.reply,
    status: inquiryStatus(row),
    createdAt: row.createdAt,
    repliedAt: row.repliedAt,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "회원가입 후 이용할 수 있습니다." }, { status: 401 });
  const rows = await listMyInquiries(user.id);
  return NextResponse.json({ inquiries: rows.map(customerView) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "회원가입 후 문의를 남길 수 있습니다." }, { status: 401 });
  const member = await memberById(user.id);
  if (!member) return NextResponse.json({ error: "회원 정보를 찾지 못했습니다." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    companyName?: string;
    message?: string;
    question?: string;
  } | null;
  const companyName = body?.companyName?.trim() ?? "";
  const message = body?.message?.trim() ?? "";
  const question = body?.question?.trim() || message;
  if (message.length < 2) {
    return NextResponse.json({ error: "문의 내용을 적어 주세요." }, { status: 400 });
  }

  const row = await addInquiry({
    userId: member.id,
    companyName,
    contactName: member.name,
    phone: member.phone,
    email: member.email,
    message,
    question,
  });
  return NextResponse.json({ ok: true, inquiry: customerView(row) });
}
