import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  canAssignWork,
  isProductionRole,
  isWeekday,
  monthKey,
  spreadAcrossWeekdays,
} from "@/lib/calendar";
import { STAFF_ROLE_LABEL } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const MAX_QUANTITY = 60;

function monthOf(value: string | null) {
  return /^\d{4}-\d{2}$/.test(value ?? "") ? value! : monthKey();
}

export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    const url = new URL(request.url);
    const month = monthOf(url.searchParams.get("month"));
    const assign = canAssignWork(staff.role);
    const people = await prisma.staff.findMany({
      where: assign
        ? { active: true, role: { in: ["EMPLOYEE", "FREELANCER", "MANAGER", "SUPER_ADMIN"] } }
        : { id: staff.id },
      select: { id: true, name: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    const ids = people.map((person) => person.id);
    const slots = await prisma.workSlot.findMany({
      where: {
        assigneeId: { in: ids },
        date: { startsWith: month },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: {
        assignee: { select: { name: true } },
        inboxItem: { select: { doneCriteria: true, driveUrl: true } },
      },
    });
    const counts = new Map<string, number>();
    for (const slot of slots) {
      counts.set(slot.customerName, (counts.get(slot.customerName) ?? 0) + 1);
    }
    return NextResponse.json({
      month,
      me: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        roleLabel: STAFF_ROLE_LABEL[staff.role],
        canAssign: assign,
        production: isProductionRole(staff.role),
      },
      people: people.map((person) => ({
        id: person.id,
        name: person.name,
        roleLabel: STAFF_ROLE_LABEL[person.role],
        production: isProductionRole(person.role),
      })),
      slots: slots.map((slot) => ({
        id: slot.id,
        customerName: slot.customerName,
        title: slot.title,
        assigneeId: slot.assigneeId,
        assigneeName: slot.assignee.name,
        date: slot.date,
        status: slot.status,
        doneCriteria: slot.inboxItem?.doneCriteria ?? "",
        driveUrl: slot.inboxItem?.driveUrl ?? "",
        chatHref: `/os/chat?customer=${encodeURIComponent(slot.customerName)}`,
        mine: slot.assigneeId === staff.id,
      })),
      counts: [...counts.entries()]
        .map(([customerName, count]) => ({ customerName, count }))
        .sort((a, b) => b.count - a.count || a.customerName.localeCompare(b.customerName, "ko")),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as {
      customerName?: string;
      title?: string;
      assigneeId?: string;
      date?: string;
      quantity?: number;
    };
    const customerName = String(body.customerName ?? "").trim();
    const title = String(body.title ?? "").trim();
    const date = String(body.date ?? "");
    const quantity = Math.floor(Number(body.quantity ?? 1));
    if (!customerName || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: "고객사, 작업명, 날짜가 필요합니다." }, { status: 400 });
    }
    if (!isWeekday(date)) {
      return NextResponse.json({ ok: false, error: "평일에만 넣을 수 있습니다." }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return NextResponse.json({ ok: false, error: `건수는 1부터 ${MAX_QUANTITY}까지입니다.` }, { status: 400 });
    }

    const assign = canAssignWork(staff.role);
    const assigneeId = assign ? String(body.assigneeId || staff.id) : staff.id;
    const assignee = await prisma.staff.findFirst({
      where: { id: assigneeId, active: true },
      select: { id: true, name: true },
    });
    if (!assignee) {
      return NextResponse.json({ ok: false, error: "배정할 사람이 없습니다." }, { status: 400 });
    }

    const month = date.slice(0, 7);
    const dates = spreadAcrossWeekdays(month, date, quantity);
    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const slotDate of dates) {
        rows.push(
          await tx.workSlot.create({
            data: {
              customerName,
              title,
              assigneeId: assignee.id,
              createdById: staff.id,
              date: slotDate,
              status: assignee.id === staff.id ? "제작 중" : "배정됨",
            },
          }),
        );
      }
      if (assignee.id !== staff.id) {
        await tx.osNotification.create({
          data: {
            staffId: assignee.id,
            kind: "GENERAL",
            title: "업무 배정",
            body: quantity > 1 ? `${customerName} · ${title} ${quantity}건` : `${customerName} · ${title}`,
            href: `/os/calendar?month=${month}`,
          },
        });
      }
      return rows;
    });

    return NextResponse.json({ ok: true, count: created.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
