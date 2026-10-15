import { NextResponse } from "next/server";
import type { LeadSource, LeadStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canSeeAllRecords } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const STAGES = new Set([
  "LEAD",
  "CONTACT",
  "CONSULT",
  "QUOTE",
  "NEGOTIATE",
  "WON",
  "LOST",
  "ON_HOLD",
]);

const SOURCES = new Set([
  "NAVER",
  "GOOGLE",
  "WEBSITE",
  "REFERRAL",
  "NAVER_CAFE",
  "NARAJANGTER",
  "WISHKET",
  "KMONG",
  "OPENCHAT",
  "DIRECT",
  "OTHER",
]);

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

export async function GET() {
  try {
    const staff = await requireStaff();
    const leads = await prisma.lead.findMany({
      where: canSeeAllRecords(staff) ? undefined : { ownerId: staff.id },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        owner: true,
        _count: { select: { activities: true } },
      },
      take: 400,
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const customerId = String(body.customerId ?? "");
    const title = String(body.title ?? "").trim();
    if (!customerId || !title) {
      return NextResponse.json(
        { ok: false, message: "고객과 제목은 필수입니다." },
        { status: 400 },
      );
    }
    const stage = STAGES.has(String(body.stage))
      ? (String(body.stage) as LeadStage)
      : "LEAD";
    const source = SOURCES.has(String(body.source))
      ? (String(body.source) as LeadSource)
      : "OTHER";

    const lead = await prisma.lead.create({
      data: {
        customerId,
        title,
        stage,
        source,
        ownerId: body.ownerId ? String(body.ownerId) : staff.id,
        desiredService: String(body.desiredService ?? ""),
        expectedAmount:
          body.expectedAmount === null ||
          body.expectedAmount === undefined ||
          body.expectedAmount === ""
            ? null
            : Number(body.expectedAmount) || null,
        nextContactDate: String(body.nextContactDate ?? ""),
        inquiryMessage: String(body.inquiryMessage ?? ""),
        memo: String(body.memo ?? ""),
        updatedById: staff.id,
      },
    });
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        staffId: staff.id,
        body: "영업 리드 생성",
      },
    });
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    return fail(error);
  }
}
