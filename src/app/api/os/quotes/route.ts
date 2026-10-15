import { NextResponse } from "next/server";
import type { QuoteStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { canManageQuotes, canSeeAllRecords } from "@/lib/os";
import { requireStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

const STATUSES = new Set([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "SUPERSEDED",
]);

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

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff)) throw new Error("FORBIDDEN");
    const quotes = await prisma.quote.findMany({
      where: canSeeAllRecords(staff)
        ? undefined
        : {
            OR: [
              { createdById: staff.id },
              { lead: { ownerId: staff.id } },
            ],
          },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        lead: true,
        createdBy: true,
        _count: { select: { children: true } },
      },
      take: 300,
    });
    return NextResponse.json({ quotes });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff)) throw new Error("FORBIDDEN");
    const body = (await request.json()) as Record<string, unknown>;
    const customerId = String(body.customerId ?? "");
    const title = String(body.title ?? "").trim();
    if (!customerId || !title) {
      return NextResponse.json(
        { ok: false, message: "고객과 제목은 필수입니다." },
        { status: 400 },
      );
    }

    // New version from existing quote
    if (body.fromQuoteId) {
      const prev = await prisma.quote.findUnique({
        where: { id: String(body.fromQuoteId) },
      });
      if (!prev) {
        return NextResponse.json({ ok: false, message: "원본 견적 없음" }, { status: 404 });
      }
      await prisma.quote.update({
        where: { id: prev.id },
        data: { status: "SUPERSEDED" },
      });
      const rootId = prev.parentId ?? prev.id;
      const latest = await prisma.quote.findFirst({
        where: { OR: [{ id: rootId }, { parentId: rootId }] },
        orderBy: { version: "desc" },
      });
      const quote = await prisma.quote.create({
        data: {
          customerId: prev.customerId,
          leadId: prev.leadId,
          title: String(body.title ?? prev.title),
          version: (latest?.version ?? prev.version) + 1,
          parentId: rootId,
          amount:
            body.amount !== undefined
              ? Number(body.amount) || 0
              : prev.amount,
          status: "DRAFT",
          validUntil: String(body.validUntil ?? prev.validUntil),
          lineItems:
            body.lineItems !== undefined
              ? (body.lineItems as object)
              : (prev.lineItems as object),
          notes: String(body.notes ?? prev.notes),
          createdById: staff.id,
        },
      });
      return NextResponse.json({ ok: true, quote });
    }

    const quote = await prisma.quote.create({
      data: {
        customerId,
        leadId: body.leadId ? String(body.leadId) : null,
        title,
        version: 1,
        amount: Number(body.amount ?? 0) || 0,
        status: STATUSES.has(String(body.status))
          ? (String(body.status) as QuoteStatus)
          : "DRAFT",
        validUntil: String(body.validUntil ?? ""),
        lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
        notes: String(body.notes ?? ""),
        createdById: staff.id,
      },
    });
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageQuotes(staff)) throw new Error("FORBIDDEN");
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
    if (body.status !== undefined && STATUSES.has(String(body.status))) {
      data.status = String(body.status) as QuoteStatus;
    }
    if (body.validUntil !== undefined) data.validUntil = String(body.validUntil);
    if (body.notes !== undefined) data.notes = String(body.notes);
    if (body.lineItems !== undefined) data.lineItems = body.lineItems;
    if (body.leadId !== undefined) {
      data.leadId = body.leadId ? String(body.leadId) : null;
    }

    const quote = await prisma.quote.update({ where: { id }, data });
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return fail(error);
  }
}
