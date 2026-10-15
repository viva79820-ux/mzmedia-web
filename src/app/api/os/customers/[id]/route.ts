import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        leads: { orderBy: { updatedAt: "desc" }, include: { owner: true } },
        projects: { orderBy: { updatedAt: "desc" } },
        inquiries: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!customer) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        companyName:
          body.companyName !== undefined
            ? String(body.companyName).trim()
            : undefined,
        contactName:
          body.contactName !== undefined
            ? String(body.contactName).trim()
            : undefined,
        phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
        email: body.email !== undefined ? String(body.email).trim() : undefined,
        memo: body.memo !== undefined ? String(body.memo).trim() : undefined,
      },
    });
    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
