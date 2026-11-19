import { NextResponse } from "next/server";
import type { LeadSource, LeadStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canSeeAmounts } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        owner: true,
        activities: {
          orderBy: { createdAt: "desc" },
          include: { staff: true },
        },
        project: true,
        inquiries: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!lead) return NextResponse.json({ ok: false }, { status: 404 });
    if (!canSeeAmounts(staff)) {
      const { expectedAmount: _expectedAmount, project, ...rest } = lead;
      return NextResponse.json({
        lead: {
          ...rest,
          project: project
            ? { id: project.id, name: project.name, status: project.status }
            : null,
        },
      });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;

    const data: Record<string, unknown> = { updatedById: staff.id };
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.stage !== undefined && STAGES.has(String(body.stage))) {
      data.stage = String(body.stage) as LeadStage;
    }
    if (body.source !== undefined && SOURCES.has(String(body.source))) {
      data.source = String(body.source) as LeadSource;
    }
    if (body.ownerId !== undefined) {
      data.ownerId = body.ownerId ? String(body.ownerId) : null;
    }
    if (body.desiredService !== undefined) {
      data.desiredService = String(body.desiredService);
    }
    if (body.expectedAmount !== undefined) {
      if (!canSeeAmounts(staff) && body.expectedAmount !== null && body.expectedAmount !== "") {
        return NextResponse.json({ ok: false, message: "금액은 대표만 저장합니다." }, { status: 403 });
      }
      data.expectedAmount = canSeeAmounts(staff)
        ? body.expectedAmount === null || body.expectedAmount === ""
          ? null
          : Number(body.expectedAmount) || null
        : null;
    }
    if (body.nextContactDate !== undefined) {
      data.nextContactDate = String(body.nextContactDate);
    }
    if (body.memo !== undefined) data.memo = String(body.memo);
    if (body.inquiryMessage !== undefined) {
      data.inquiryMessage = String(body.inquiryMessage);
    }

    const lead = await prisma.lead.update({ where: { id }, data });

    if (body.activityBody && String(body.activityBody).trim()) {
      await prisma.leadActivity.create({
        data: {
          leadId: id,
          staffId: staff.id,
          body: String(body.activityBody).trim(),
        },
      });
    } else if (body.stage) {
      await prisma.leadActivity.create({
        data: {
          leadId: id,
          staffId: staff.id,
          body: `단계 변경 → ${String(body.stage)}`,
        },
      });
    }

    // Convert won lead into project when requested or stage becomes WON without project
    if (
      (body.convertToProject === true || body.stage === "WON") &&
      !lead.projectId
    ) {
      const full = await prisma.lead.findUnique({
        where: { id },
        include: { customer: true },
      });
      if (full) {
        const project = await prisma.project.create({
          data: {
            customerId: full.customerId,
            name: full.title,
            status: "CONTRACTED",
            contractAmount: canSeeAmounts(staff) ? full.expectedAmount ?? 0 : 0,
            serviceCategory: full.desiredService || "",
            channelSource: full.source,
            startDate: new Date().toISOString().slice(0, 10),
            memo: full.memo,
            updatedById: staff.id,
            members: full.ownerId
              ? { create: { staffId: full.ownerId, roleLabel: "owner" } }
              : undefined,
          },
        });
        await prisma.lead.update({
          where: { id },
          data: { projectId: project.id, stage: "WON", updatedById: staff.id },
        });
        return NextResponse.json({ ok: true, leadId: id, projectId: project.id });
      }
    }

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
