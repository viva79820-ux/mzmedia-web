import { NextResponse } from "next/server";
import type { ProjectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canSeeAllRecords, isFreelancer } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const STATUSES = new Set([
  "CONTRACTED",
  "PREP",
  "IN_PROGRESS",
  "REVIEW",
  "REVISION",
  "DELIVERED",
  "CLOSED",
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
    const projects = await prisma.project.findMany({
      where:
        canSeeAllRecords(staff) && !isFreelancer(staff)
          ? undefined
          : {
              OR: [
                { members: { some: { staffId: staff.id } } },
                { tasks: { some: { assigneeId: staff.id } } },
              ],
            },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        members: { include: { staff: true } },
        _count: { select: { tasks: true, payments: true } },
      },
      take: 300,
    });
    return NextResponse.json({ projects });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const customerId = String(body.customerId ?? "");
    const name = String(body.name ?? "").trim();
    if (!customerId || !name) {
      return NextResponse.json(
        { ok: false, message: "고객과 프로젝트명은 필수입니다." },
        { status: 400 },
      );
    }
    const status = STATUSES.has(String(body.status))
      ? (String(body.status) as ProjectStatus)
      : "CONTRACTED";

    const project = await prisma.project.create({
      data: {
        customerId,
        name,
        status,
        contractAmount: Number(body.contractAmount ?? 0) || 0,
        serviceCategory: String(body.serviceCategory ?? ""),
        channelSource: String(body.channelSource ?? ""),
        startDate: String(body.startDate ?? ""),
        dueDate: String(body.dueDate ?? ""),
        progress: Number(body.progress ?? 0) || 0,
        memo: String(body.memo ?? ""),
        updatedById: staff.id,
        members: {
          create: { staffId: staff.id, roleLabel: "owner" },
        },
      },
    });
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    return fail(error);
  }
}
