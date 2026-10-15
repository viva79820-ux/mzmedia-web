import { NextResponse } from "next/server";
import type { RecurringCadence, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { periodKeyForCadence } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const CADENCES = new Set(["DAILY", "WEEKLY", "MONTHLY"]);

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

async function ensureInstances() {
  const templates = await prisma.recurringTemplate.findMany({
    where: { active: true },
  });
  for (const template of templates) {
    const key = periodKeyForCadence(template.cadence);
    await prisma.recurringInstance.upsert({
      where: {
        templateId_periodKey: {
          templateId: template.id,
          periodKey: key,
        },
      },
      create: {
        templateId: template.id,
        periodKey: key,
        assigneeId: template.assigneeId,
        kpiTarget: template.kpiTarget,
        kpiDone: 0,
        status: "TODO",
      },
      update: {},
    });
  }
}

export async function GET() {
  try {
    await requireStaff();
    await ensureInstances();
    const templates = await prisma.recurringTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignee: true,
        instances: {
          orderBy: { periodKey: "desc" },
          take: 8,
        },
      },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "업무명은 필수입니다." },
        { status: 400 },
      );
    }
    const cadence = CADENCES.has(String(body.cadence))
      ? (String(body.cadence) as RecurringCadence)
      : "DAILY";
    const template = await prisma.recurringTemplate.create({
      data: {
        title,
        description: String(body.description ?? ""),
        cadence,
        kpiTarget: Number(body.kpiTarget ?? 1) || 1,
        assigneeId: body.assigneeId ? String(body.assigneeId) : staff.id,
        active: body.active !== false,
      },
    });
    await ensureInstances();
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;

    if (body.instanceId) {
      const id = String(body.instanceId);
      const data: Record<string, unknown> = {};
      if (body.kpiDone !== undefined) {
        data.kpiDone = Math.max(0, Number(body.kpiDone) || 0);
      }
      if (body.status !== undefined) {
        data.status = String(body.status) as TaskStatus;
      }
      const instance = await prisma.recurringInstance.update({
        where: { id },
        data,
      });
      return NextResponse.json({ ok: true, instance });
    }

    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) {
      data.description = String(body.description);
    }
    if (body.cadence !== undefined && CADENCES.has(String(body.cadence))) {
      data.cadence = String(body.cadence) as RecurringCadence;
    }
    if (body.kpiTarget !== undefined) {
      data.kpiTarget = Number(body.kpiTarget) || 1;
    }
    if (body.assigneeId !== undefined) {
      data.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    }
    if (body.active !== undefined) data.active = Boolean(body.active);
    const template = await prisma.recurringTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    return fail(error);
  }
}
