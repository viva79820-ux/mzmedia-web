import { NextResponse } from "next/server";
import type { ProjectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = new Set([
  "CONTRACTED",
  "PREP",
  "IN_PROGRESS",
  "REVIEW",
  "REVISION",
  "DELIVERED",
  "CLOSED",
]);

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        members: { include: { staff: true } },
        tasks: {
          orderBy: { updatedAt: "desc" },
          include: { assignee: true },
        },
        payments: { orderBy: { dueDate: "asc" } },
        costs: { orderBy: { createdAt: "desc" } },
        lead: true,
      },
    });
    if (!project) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ project });
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
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.status !== undefined && STATUSES.has(String(body.status))) {
      data.status = String(body.status) as ProjectStatus;
    }
    if (body.contractAmount !== undefined) {
      data.contractAmount = Number(body.contractAmount) || 0;
    }
    if (body.startDate !== undefined) data.startDate = String(body.startDate);
    if (body.dueDate !== undefined) data.dueDate = String(body.dueDate);
    if (body.deliveredAt !== undefined) {
      data.deliveredAt = String(body.deliveredAt);
    }
    if (body.progress !== undefined) {
      data.progress = Math.min(100, Math.max(0, Number(body.progress) || 0));
    }
    if (body.memo !== undefined) data.memo = String(body.memo);
    if (body.addMemberId) {
      await prisma.projectMember.upsert({
        where: {
          projectId_staffId: {
            projectId: id,
            staffId: String(body.addMemberId),
          },
        },
        create: {
          projectId: id,
          staffId: String(body.addMemberId),
          roleLabel: String(body.memberRole ?? "member"),
        },
        update: {},
      });
    }
    const project = await prisma.project.update({ where: { id }, data });
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
