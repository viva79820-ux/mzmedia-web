import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guardOffice } from "@/lib/office/guard";
import { openDeliveryPackage } from "@/lib/office/package";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const inquiryId = new URL(request.url).searchParams.get("inquiryId");
  if (!inquiryId) return NextResponse.json({ request: "", companyName: "", contactName: "" });
  const inquiry = await prisma.estimateInquiry.findUnique({
    where: { id: inquiryId },
    include: { product: { select: { name: true } } },
  });
  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  const service = inquiry.serviceName || inquiry.product?.name || "";
  return NextResponse.json({
    companyName: inquiry.companyName,
    contactName: inquiry.contactName,
    request: [
      service ? `서비스: ${service}` : "",
      inquiry.budgetLabel ? `예산: ${inquiry.budgetLabel}` : "",
      inquiry.dueDate ? `희망일: ${inquiry.dueDate}` : "",
      inquiry.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function POST(request: Request) {
  const denied = await guardOffice();
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as {
    request?: string;
    companyName?: string;
    contactName?: string;
    inquiryId?: string;
  } | null;
  try {
    const data = await openDeliveryPackage({
      request: body?.request ?? "",
      companyName: body?.companyName,
      contactName: body?.contactName,
      inquiryId: body?.inquiryId,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "전달 패키지를 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
