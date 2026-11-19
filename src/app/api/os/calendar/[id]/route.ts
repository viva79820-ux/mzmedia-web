import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SLOT_STATUSES, canAssignWork, isWeekday } from "@/lib/calendar";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function loadEditable(id: string, staffId: string, assign: boolean) {
  const slot = await prisma.workSlot.findUnique({ where: { id } });
  if (!slot) return null;
  if (!assign && slot.assigneeId !== staffId) return "forbidden" as const;
  return slot;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const staff = await requireStaff();
    const { id } = await params;
    const assign = canAssignWork(staff.role);
    const slot = await loadEditable(id, staff.id, assign);
    if (!slot) return NextResponse.json({ ok: false }, { status: 404 });
    if (slot === "forbidden") return NextResponse.json({ ok: false }, { status: 403 });

    const body = (await request.json()) as {
      customerName?: string;
      title?: string;
      date?: string;
      status?: string;
      assigneeId?: string;
    };
    const data: {
      customerName?: string;
      title?: string;
      date?: string;
      status?: string;
      assigneeId?: string;
    } = {};
    if (body.customerName !== undefined) {
      const customerName = String(body.customerName).trim();
      if (!customerName) return NextResponse.json({ ok: false, error: "고객사가 필요합니다." }, { status: 400 });
      data.customerName = customerName;
    }
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ ok: false, error: "작업명이 필요합니다." }, { status: 400 });
      data.title = title;
    }
    if (body.date !== undefined) {
      const date = String(body.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isWeekday(date)) {
        return NextResponse.json({ ok: false, error: "평일 날짜만 가능합니다." }, { status: 400 });
      }
      data.date = date;
    }
    if (body.status !== undefined) {
      if (!SLOT_STATUSES.includes(body.status as (typeof SLOT_STATUSES)[number])) {
        return NextResponse.json({ ok: false, error: "상태를 확인할 수 없습니다." }, { status: 400 });
      }
      data.status = body.status;
    }
    let notifyAssignee: string | null = null;
    if (body.assigneeId !== undefined) {
      if (!assign) return NextResponse.json({ ok: false }, { status: 403 });
      const assignee = await prisma.staff.findFirst({
        where: { id: String(body.assigneeId), active: true },
        select: { id: true },
      });
      if (!assignee) return NextResponse.json({ ok: false, error: "배정할 사람이 없습니다." }, { status: 400 });
      data.assigneeId = assignee.id;
      if (assignee.id !== slot.assigneeId && assignee.id !== staff.id) notifyAssignee = assignee.id;
    }

    const updated = await prisma.workSlot.update({ where: { id }, data });
    if (notifyAssignee) {
      await prisma.osNotification.create({
        data: {
          staffId: notifyAssignee,
          kind: "GENERAL",
          title: "업무 배정",
          body: `${updated.customerName} · ${updated.title}`,
          href: `/os/calendar?month=${updated.date.slice(0, 7)}`,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const staff = await requireStaff();
    const { id } = await params;
    const slot = await loadEditable(id, staff.id, canAssignWork(staff.role));
    if (!slot) return NextResponse.json({ ok: false }, { status: 404 });
    if (slot === "forbidden") return NextResponse.json({ ok: false }, { status: 403 });
    await prisma.workSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
