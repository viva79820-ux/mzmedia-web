import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { monthKey } from "@/lib/calendar";
import { requireStaffRole } from "@/lib/staff-auth";
import { splitWorkSentence } from "@/lib/work-sentence";

export const runtime = "nodejs";

function fail(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  console.error(error);
  return NextResponse.json({ ok: false }, { status: 500 });
}

function present(item: {
  id: string;
  customerName: string;
  title: string;
  detail: string;
  quantity: number;
  doneCriteria: string;
  month: string;
  driveUrl: string;
  kind: string;
  reason: string;
  status: string;
  startDate: string;
  assignee: { id: string; name: string } | null;
}) {
  return {
    id: item.id,
    customerName: item.customerName,
    title: item.title,
    detail: item.detail,
    quantity: item.quantity,
    doneCriteria: item.doneCriteria,
    month: item.month,
    driveUrl: item.driveUrl,
    kind: item.kind,
    reason: item.reason,
    status: item.status,
    startDate: item.startDate,
    assigneeId: item.assignee?.id ?? "",
    assigneeName: item.assignee?.name ?? "",
  };
}

export async function GET() {
  try {
    const staff = await requireStaffRole("SUPER_ADMIN", "MANAGER");
    const [items, people] = await Promise.all([
      prisma.inboxItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { assignee: { select: { id: true, name: true } } },
      }),
      prisma.staff.findMany({
        where: { active: true, role: { in: ["EMPLOYEE", "FREELANCER"] } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({
      me: { id: staff.id, role: staff.role, canRegister: staff.role === "SUPER_ADMIN" },
      people,
      items: items.map(present),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaffRole("SUPER_ADMIN");
    const body = (await request.json()) as {
      sentence?: string;
      customerName?: string;
      month?: string;
      driveUrl?: string;
      scopeText?: string;
    };
    const sentence = String(body.sentence ?? "").trim();
    const month = /^\d{4}-\d{2}$/.test(String(body.month ?? "")) ? String(body.month) : monthKey();
    const driveUrl = String(body.driveUrl ?? "").trim();
    const split = splitWorkSentence({
      sentence,
      customerName: String(body.customerName ?? ""),
      month,
      scopeText: String(body.scopeText ?? ""),
    });
    if (split.error && split.tasks.length === 0 && split.checks.length === 0) {
      return NextResponse.json({ ok: false, error: split.error }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const task of split.tasks) {
        rows.push(
          await tx.inboxItem.create({
            data: {
              customerName: task.customerName,
              title: task.title,
              detail: task.detail,
              quantity: task.quantity,
              doneCriteria: task.doneCriteria,
              month: task.month,
              driveUrl,
              sourceSentence: sentence,
              kind: "업무",
              status: "접수",
              createdById: staff.id,
            },
          }),
        );
      }
      for (const check of split.checks) {
        rows.push(
          await tx.inboxItem.create({
            data: {
              customerName: check.customerName,
              title: check.title,
              detail: check.detail,
              quantity: check.quantity,
              doneCriteria: check.doneCriteria,
              month: check.month,
              driveUrl,
              sourceSentence: sentence,
              kind: "확인필요",
              reason: check.reason,
              status: "접수",
              createdById: staff.id,
            },
          }),
        );
      }
      const managers = await tx.staff.findMany({
        where: { active: true, role: "MANAGER", id: { not: staff.id } },
        select: { id: true },
      });
      const taskSummary = split.tasks.map((task) => `${task.title} ${task.quantity}건`).join(", ");
      const checkSummary = split.checks.map((task) => task.title).join(", ");
      const summary = [taskSummary, checkSummary ? `확인 필요 ${checkSummary}` : ""].filter(Boolean).join(" · ");
      for (const manager of managers) {
        await tx.osNotification.create({
          data: {
            staffId: manager.id,
            kind: "GENERAL",
            title: split.tasks.length > 0 ? "수신함 업무" : "확인 필요",
            body: `${split.tasks[0]?.customerName || split.checks[0]?.customerName || ""} · ${summary}`.trim(),
            href: "/os/inbox",
          },
        });
      }
      return rows;
    });

    return NextResponse.json({
      ok: true,
      tasks: created.filter((item) => item.kind === "업무").map((item) => ({
        id: item.id,
        customerName: item.customerName,
        title: item.title,
        quantity: item.quantity,
        month: item.month,
      })),
      checks: created.filter((item) => item.kind === "확인필요").map((item) => ({
        id: item.id,
        title: item.title,
        reason: item.reason,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
