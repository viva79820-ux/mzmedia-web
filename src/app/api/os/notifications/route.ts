import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshOsNotifications } from "@/lib/os-notifications";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const staff = await requireStaff();
    await refreshOsNotifications();
    const notifications = await prisma.osNotification.findMany({
      where: { staffId: staff.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    return NextResponse.json({ notifications, unread });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as {
      id?: string;
      markAllRead?: boolean;
    };

    if (body.markAllRead) {
      await prisma.osNotification.updateMany({
        where: { staffId: staff.id, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.osNotification.updateMany({
      where: { id, staffId: staff.id },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
