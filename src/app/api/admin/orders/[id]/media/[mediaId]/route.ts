import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; mediaId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id, mediaId } = await ctx.params;
    const media = await prisma.orderMedia.findFirst({
      where: { id: mediaId, orderId: id },
    });
    if (!media) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(media.data), {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(media.size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(media.originalName)}`,
        "Cache-Control": "private, max-age=3600",
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

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id, mediaId } = await ctx.params;
    await prisma.orderMedia.deleteMany({
      where: { id: mediaId, orderId: id },
    });

    const order = await prisma.order.findUnique({
      where: { id },
      select: { detailText: true, _count: { select: { media: true } } },
    });
    if (order) {
      await prisma.order.update({
        where: { id },
        data: {
          hasDetail:
            Boolean(order.detailText.trim()) || order._count.media > 0,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
