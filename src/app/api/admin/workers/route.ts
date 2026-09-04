import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { DEFAULT_HOURLY_WAGE } from "@/lib/wages";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET() {
  try {
    await requireAdmin();
    const workers = await prisma.worker.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({
      workers: workers.map((w) => ({
        id: w.id,
        name: w.name,
        hourlyWage: w.hourlyWage,
        holidayPayEnabled: w.holidayPayEnabled,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      hourlyWage?: number;
      holidayPayEnabled?: boolean;
    };
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, message: "이름을 입력해 주세요." },
        { status: 400 },
      );
    }

    const created = await prisma.worker.create({
      data: {
        name,
        hourlyWage:
          Number.isFinite(Number(body.hourlyWage)) && Number(body.hourlyWage) >= 0
            ? Math.round(Number(body.hourlyWage))
            : DEFAULT_HOURLY_WAGE,
        holidayPayEnabled: body.holidayPayEnabled !== false,
      },
    });

    return NextResponse.json({
      id: created.id,
      name: created.name,
      hourlyWage: created.hourlyWage,
      holidayPayEnabled: created.holidayPayEnabled,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
