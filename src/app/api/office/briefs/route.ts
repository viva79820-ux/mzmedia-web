import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jobIdForInquiry } from "@/lib/office/db";
import { openMeetingBrief } from "@/lib/office/brief";
import { guardOffice } from "@/lib/office/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardOffice();
  if (denied) return denied;
  const inquiries = await prisma.estimateInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { product: { select: { name: true } } },
  });
  const items = await Promise.all(
    inquiries.map(async (inquiry) => ({
      id: inquiry.id,
      companyName: inquiry.companyName,
      contactName: inquiry.contactName,
      serviceName: inquiry.serviceName || inquiry.product?.name || "견적 문의",
      createdAt: inquiry.createdAt.toISOString(),
      jobId: await jobIdForInquiry(inquiry.id),
    })),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as { inquiryId?: string } | null;
  if (!body?.inquiryId) {
    return NextResponse.json({ error: "문의를 지정해 주세요." }, { status: 400 });
  }
  const inquiry = await prisma.estimateInquiry.findUnique({
    where: { id: body.inquiryId },
    include: { product: { select: { name: true } } },
  });
  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  const data = await openMeetingBrief(inquiry);
  return NextResponse.json(data);
}
