import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { calcAmount, toOrderListItem } from "@/lib/orders";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        media: {
          select: {
            id: true,
            kind: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: toOrderListItem(order),
      detail: {
        text: order.detailText,
        images: order.media
          .filter((m) => m.kind === "image")
          .map((m) => ({
            id: m.id,
            url: `/api/admin/orders/${id}/media/${m.id}`,
            name: m.fileName,
            originalName: m.originalName,
            size: m.size,
          })),
        files: order.media
          .filter((m) => m.kind === "pdf")
          .map((m) => ({
            id: m.id,
            url: `/api/admin/orders/${id}/media/${m.id}`,
            name: m.fileName,
            originalName: m.originalName,
            size: m.size,
          })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const quantity = Number(body.수량 ?? body.quantity ?? existing.quantity) || 0;
    const unitPrice =
      Number(body.단가 ?? body.unitPrice ?? existing.unitPrice) || 0;

    const detailText =
      typeof body.detailText === "string"
        ? body.detailText
        : typeof body.세부내용 === "string"
          ? body.세부내용
          : undefined;

    const mediaCount = await prisma.orderMedia.count({ where: { orderId: id } });
    const nextDetailText =
      detailText !== undefined ? detailText : existing.detailText;
    const hasDetail =
      Boolean(nextDetailText.trim()) || mediaCount > 0;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        orderDate:
          (typeof body.날짜 === "string" && body.날짜) ||
          (typeof body.orderDate === "string" && body.orderDate) ||
          existing.orderDate,
        clientName: String(
          body.거래처명 ?? body.clientName ?? existing.clientName,
        ),
        contact: String(body.연락처 ?? body.contact ?? existing.contact),
        product: String(
          body["상품/서비스"] ?? body.product ?? existing.product,
        ),
        quantity,
        unitPrice,
        amount: calcAmount(quantity, unitPrice),
        status: String(body.상태 ?? body.status ?? existing.status),
        assignee: String(body.담당자 ?? body.assignee ?? existing.assignee),
        memo: String(body.메모 ?? body.memo ?? existing.memo),
        ...(detailText !== undefined ? { detailText, hasDetail } : { hasDetail }),
      },
    });

    return NextResponse.json(toOrderListItem(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
