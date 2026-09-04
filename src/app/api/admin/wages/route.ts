import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { asHoursMap, DEFAULT_HOURLY_WAGE } from "@/lib/wages";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

function parseYearMonth(yearRaw: unknown, monthRaw: unknown) {
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const workerId = String(url.searchParams.get("workerId") || "").trim();
    const parsed = parseYearMonth(
      url.searchParams.get("year"),
      url.searchParams.get("month"),
    );
    if (!workerId || !parsed) {
      return NextResponse.json(
        { ok: false, message: "직원과 연월이 필요합니다." },
        { status: 400 },
      );
    }

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) {
      return NextResponse.json(
        { ok: false, message: "직원을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const sheet = await prisma.wageMonth.findUnique({
      where: {
        workerId_year_month: {
          workerId,
          year: parsed.year,
          month: parsed.month,
        },
      },
    });

    return NextResponse.json({
      worker: {
        id: worker.id,
        name: worker.name,
        hourlyWage: worker.hourlyWage,
        holidayPayEnabled: worker.holidayPayEnabled,
      },
      sheet: {
        workerId,
        year: parsed.year,
        month: parsed.month,
        hourlyWage: sheet?.hourlyWage ?? worker.hourlyWage,
        holidayPayEnabled: sheet?.holidayPayEnabled ?? worker.holidayPayEnabled,
        hoursByDate: asHoursMap(sheet?.hoursByDate),
        memo: sheet?.memo ?? "",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as {
      workerId?: string;
      year?: number;
      month?: number;
      hourlyWage?: number;
      holidayPayEnabled?: boolean;
      hoursByDate?: unknown;
      memo?: string;
      name?: string;
    };

    const workerId = String(body.workerId || "").trim();
    const parsed = parseYearMonth(body.year, body.month);
    if (!workerId || !parsed) {
      return NextResponse.json(
        { ok: false, message: "직원과 연월이 필요합니다." },
        { status: 400 },
      );
    }

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) {
      return NextResponse.json(
        { ok: false, message: "직원을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const hourlyWage =
      Number.isFinite(Number(body.hourlyWage)) && Number(body.hourlyWage) >= 0
        ? Math.round(Number(body.hourlyWage))
        : worker.hourlyWage || DEFAULT_HOURLY_WAGE;
    const holidayPayEnabled =
      typeof body.holidayPayEnabled === "boolean"
        ? body.holidayPayEnabled
        : worker.holidayPayEnabled;
    const hoursByDate = asHoursMap(body.hoursByDate);
    const memo = typeof body.memo === "string" ? body.memo : "";
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : worker.name;

    const [sheet] = await prisma.$transaction([
      prisma.wageMonth.upsert({
        where: {
          workerId_year_month: {
            workerId,
            year: parsed.year,
            month: parsed.month,
          },
        },
        create: {
          workerId,
          year: parsed.year,
          month: parsed.month,
          hourlyWage,
          holidayPayEnabled,
          hoursByDate,
          memo,
        },
        update: {
          hourlyWage,
          holidayPayEnabled,
          hoursByDate,
          memo,
        },
      }),
      prisma.worker.update({
        where: { id: workerId },
        data: { name, hourlyWage, holidayPayEnabled },
      }),
    ]);

    return NextResponse.json({
      worker: {
        id: workerId,
        name,
        hourlyWage,
        holidayPayEnabled,
      },
      sheet: {
        workerId,
        year: parsed.year,
        month: parsed.month,
        hourlyWage: sheet.hourlyWage,
        holidayPayEnabled: sheet.holidayPayEnabled,
        hoursByDate: asHoursMap(sheet.hoursByDate),
        memo: sheet.memo,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorized();
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
