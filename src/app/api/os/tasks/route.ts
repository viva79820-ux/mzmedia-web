import { NextResponse } from "next/server";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canSeeAllRecords, todayKey } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const STATUSES = new Set(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "HOLD"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "mine";
    const where =
      scope === "all" && canSeeAllRecords(staff)
        ? {}
        : { assigneeId: staff.id };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        project: true,
        assignee: true,
      },
      take: 400,
    });
    return NextResponse.json({ tasks, today: todayKey() });
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
    const task = await prisma.task.create({
      data: {
        title,
        description: String(body.description ?? ""),
        projectId: body.projectId ? String(body.projectId) : null,
        assigneeId: body.assigneeId ? String(body.assigneeId) : staff.id,
        createdById: staff.id,
        priority: PRIORITIES.has(String(body.priority))
          ? (String(body.priority) as TaskPriority)
          : "MEDIUM",
        status: STATUSES.has(String(body.status))
          ? (String(body.status) as TaskStatus)
          : "TODO",
        progress: Number(body.progress ?? 0) || 0,
        startDate: String(body.startDate ?? ""),
        dueDate: String(body.dueDate ?? ""),
        memo: String(body.memo ?? ""),
      },
    });
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) {
      data.description = String(body.description);
    }
    if (body.status !== undefined && STATUSES.has(String(body.status))) {
      data.status = String(body.status) as TaskStatus;
      if (body.status === "DONE") {
        data.completedAt = todayKey();
        data.progress = 100;
      }
    }
    if (body.priority !== undefined && PRIORITIES.has(String(body.priority))) {
      data.priority = String(body.priority) as TaskPriority;
    }
    if (body.progress !== undefined) {
      data.progress = Math.min(100, Math.max(0, Number(body.progress) || 0));
    }
    if (body.dueDate !== undefined) data.dueDate = String(body.dueDate);
    if (body.assigneeId !== undefined) {
      data.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    }
    if (body.resultNote !== undefined) data.resultNote = String(body.resultNote);
    if (body.memo !== undefined) data.memo = String(body.memo);
    if (body.projectId !== undefined) {
      data.projectId = body.projectId ? String(body.projectId) : null;
    }

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    return fail(error);
  }
}
