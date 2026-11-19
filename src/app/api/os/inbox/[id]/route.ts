import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAssignWork, isWeekday, spreadMonthFrom } from "@/lib/calendar";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const staff = await requireStaff();
    if (!canAssignWork(staff.role)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const { id } = await params;
    const body = (await request.json()) as { assigneeId?: string; date?: string };
    const assigneeId = String(body.assigneeId ?? "");
    const date = String(body.date ?? "");
    if (!assigneeId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: "생산팀 담당자와 날짜가 필요합니다." }, { status: 400 });
    }
    if (!isWeekday(date)) {
      return NextResponse.json({ ok: false, error: "평일에만 배정할 수 있습니다." }, { status: 400 });
    }

    const item = await prisma.inboxItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ ok: false }, { status: 404 });
    if (item.kind !== "업무") {
      return NextResponse.json({ ok: false, error: "확인 필요 항목은 달력에 배정하지 않습니다." }, { status: 400 });
    }
    if (item.status === "배정됨") {
      return NextResponse.json({ ok: false, error: "이미 배정된 업무입니다." }, { status: 400 });
    }
    if (!date.startsWith(item.month)) {
      return NextResponse.json({ ok: false, error: "이 업무의 해당 월 안에서 날짜를 고르세요." }, { status: 400 });
    }

    const assignee = await prisma.staff.findFirst({
      where: { id: assigneeId, active: true, role: { in: ["EMPLOYEE", "FREELANCER"] } },
      select: { id: true, name: true },
    });
    if (!assignee) {
      return NextResponse.json({ ok: false, error: "생산팀 담당자를 고르세요." }, { status: 400 });
    }

    const dates = spreadMonthFrom(item.month, date, item.quantity);
    await prisma.$transaction(async (tx) => {
      for (const slotDate of dates) {
        await tx.workSlot.create({
          data: {
            customerName: item.customerName,
            title: item.title,
            assigneeId: assignee.id,
            createdById: staff.id,
            inboxItemId: item.id,
            date: slotDate,
            status: "배정됨",
          },
        });
      }
      await tx.inboxItem.update({
        where: { id: item.id },
        data: { status: "배정됨", assigneeId: assignee.id, startDate: date },
      });
      if (assignee.id !== staff.id) {
        await tx.osNotification.create({
          data: {
            staffId: assignee.id,
            kind: "GENERAL",
            title: "업무 배정",
            body: `${item.customerName} · ${item.title} ${item.quantity}건`,
            href: `/os/calendar?month=${item.month}`,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, count: dates.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
