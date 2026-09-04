import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { DEFAULT_HOURLY_WAGE } from "@/lib/wages";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

function toWorker(w: {
  id: string;
  name: string;
  hourlyWage: number;
  holidayPayEnabled: boolean;
}) {
  return {
    id: w.id,
    name: w.name,
    hourlyWage: w.hourlyWage,
    holidayPayEnabled: w.holidayPayEnabled,
  };
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      hourlyWage?: number;
      holidayPayEnabled?: boolean;
    };

    const current = await prisma.worker.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ ok: false, message: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : current.name;
    if (!name) {
      return NextResponse.json(
        { ok: false, message: "이름을 입력해 주세요." },
        { status: 400 },
      );
    }

    const hourlyWage =
      Number.isFinite(Number(body.hourlyWage)) && Number(body.hourlyWage) >= 0
        ? Math.round(Number(body.hourlyWage))
        : current.hourlyWage || DEFAULT_HOURLY_WAGE;

    const updated = await prisma.worker.update({
      where: { id },
      data: {
        name,
        hourlyWage,
        holidayPayEnabled:
          typeof body.holidayPayEnabled === "boolean"
            ? body.holidayPayEnabled
            : current.holidayPayEnabled,
      },
    });

    return NextResponse.json(toWorker(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await prisma.worker.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
