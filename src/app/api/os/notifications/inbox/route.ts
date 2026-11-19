import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDueAlertMail } from "@/lib/send-due-mail";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const staff = await requireStaff();
    await sendDueAlertMail().catch(() => undefined);
    const hideAmounts = staff.role !== "SUPER_ADMIN";
    const where = hideAmounts
      ? { staffId: staff.id, kind: { not: "OVERDUE_PAYMENT" as const } }
      : { staffId: staff.id };
    const [notifications, unread] = await Promise.all([
      prisma.osNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true },
      }),
      prisma.osNotification.count({ where: { ...where, readAt: null } }),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
