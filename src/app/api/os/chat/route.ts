import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatPreview, hasMoney, otherRecipients } from "@/lib/chat";
import { canAssignWork, isProductionRole } from "@/lib/calendar";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

function seoulStamp() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

async function customerNames(staffId: string, production: boolean) {
  const [slots, inbox] = await Promise.all([
    prisma.workSlot.findMany({
      where: production ? { assigneeId: staffId } : {},
      select: { customerName: true },
      distinct: ["customerName"],
    }),
    prisma.inboxItem.findMany({
      where: production ? { assigneeId: staffId, kind: "업무" } : { kind: "업무" },
      select: { customerName: true },
      distinct: ["customerName"],
    }),
  ]);
  return [...new Set([...slots, ...inbox].map((row) => row.customerName))].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    if (!["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"].includes(staff.role)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const production = isProductionRole(staff.role);
    const names = await customerNames(staff.id, production);
    const url = new URL(request.url);
    const customerName = url.searchParams.get("customer") ?? "";
    if (!customerName) {
      return NextResponse.json({ rooms: names.map((name) => ({ customerName: name })) });
    }
    if (!names.includes(customerName)) return NextResponse.json({ ok: false }, { status: 403 });
    const room = await prisma.projectRoom.upsert({
      where: { customerName },
      update: {},
      create: { customerName },
    });
    const [messages, works] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { roomId: room.id },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      prisma.inboxItem.findMany({
        where: { customerName, kind: "업무" },
        select: { id: true, title: true, quantity: true },
        take: 30,
      }),
    ]);
    return NextResponse.json({
      customerName,
      canRecord: canAssignWork(staff.role),
      works: canAssignWork(staff.role) ? works : [],
      messages: messages.map((message) => ({
        id: message.id,
        authorName: message.authorName,
        body: message.body,
        recorded: Boolean(message.recordedItemId),
        createdAt: message.createdAt,
        mine: message.authorId === staff.id,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"].includes(staff.role)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const production = isProductionRole(staff.role);
    const body = (await request.json()) as { customerName?: string; body?: string; inboxItemId?: string };
    const customerName = String(body.customerName ?? "").trim();
    const text = String(body.body ?? "").trim();
    const inboxItemId = String(body.inboxItemId ?? "");
    if (!customerName || !text) {
      return NextResponse.json({ ok: false, error: "고객사와 메시지가 필요합니다." }, { status: 400 });
    }
    if (text.length > 2000) return NextResponse.json({ ok: false, error: "메시지가 너무 깁니다." }, { status: 400 });
    if (hasMoney(text)) return NextResponse.json({ ok: false, error: "대화에는 금액을 넣지 않습니다." }, { status: 400 });
    const names = await customerNames(staff.id, production);
    if (!names.includes(customerName)) return NextResponse.json({ ok: false }, { status: 403 });
    if (inboxItemId && !canAssignWork(staff.role)) return NextResponse.json({ ok: false }, { status: 403 });

    const room = await prisma.projectRoom.upsert({
      where: { customerName },
      update: {},
      create: { customerName },
    });
    const message = await prisma.$transaction(async (tx) => {
      if (inboxItemId) {
        const item = await tx.inboxItem.findFirst({ where: { id: inboxItemId, customerName, kind: "업무" } });
        if (!item) throw new Error("NO_WORK");
        const line = `합의 ${seoulStamp()} ${text}`;
        await tx.inboxItem.update({
          where: { id: item.id },
          data: { detail: item.detail ? `${item.detail}\n${line}` : line },
        });
      }
      const created = await tx.chatMessage.create({
        data: {
          roomId: room.id,
          authorId: staff.id,
          authorName: staff.name,
          body: text,
          recordedItemId: inboxItemId,
        },
      });
      const [managers, assignees] = await Promise.all([
        tx.staff.findMany({
          where: { active: true, role: { in: ["SUPER_ADMIN", "MANAGER"] } },
          select: { id: true },
        }),
        tx.workSlot.findMany({
          where: { customerName },
          select: { assigneeId: true },
          distinct: ["assigneeId"],
        }),
      ]);
      const inboxAssignees = await tx.inboxItem.findMany({
        where: { customerName, assigneeId: { not: null } },
        select: { assigneeId: true },
      });
      const candidateIds = [
        ...assignees.map((row) => row.assigneeId),
        ...inboxAssignees.map((row) => row.assigneeId || ""),
      ].filter(Boolean);
      const activePeople = await tx.staff.findMany({
        where: { active: true, id: { in: candidateIds } },
        select: { id: true },
      });
      const ids = otherRecipients(
        [...managers.map((person) => person.id), ...activePeople.map((person) => person.id)],
        staff.id,
      );
      if (ids.length > 0) {
        await tx.osNotification.createMany({
          data: ids.map((staffId) => ({
            staffId,
            kind: "GENERAL" as const,
            title: "프로젝트 대화",
            body: chatPreview(customerName, text),
            href: `/os/chat?customer=${encodeURIComponent(customerName)}`,
          })),
        });
      }
      return created;
    });
    return NextResponse.json({ ok: true, id: message.id });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_WORK") {
      return NextResponse.json({ ok: false, error: "이 고객사의 업무가 아닙니다." }, { status: 400 });
    }
    return fail(error);
  }
}
