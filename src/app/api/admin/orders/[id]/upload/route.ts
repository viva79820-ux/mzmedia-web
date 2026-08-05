import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function refreshHasDetail(orderId: string) {
  return prisma.order
    .findUnique({
      where: { id: orderId },
      select: { detailText: true, _count: { select: { media: true } } },
    })
    .then((order) => {
      if (!order) return;
      const hasDetail =
        Boolean(order.detailText.trim()) || order._count.media > 0;
      return prisma.order.update({
        where: { id: orderId },
        data: { hasDetail },
      });
    });
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { dataUrl?: string };
      const dataUrl = body.dataUrl || "";
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { error: "이미지 데이터가 올바르지 않습니다." },
          { status: 400 },
        );
      }
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "이미지는 8MB 이하만 첨부할 수 있습니다." },
          { status: 400 },
        );
      }
      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const fileName = `${Date.now()}.${ext}`;
      const media = await prisma.orderMedia.create({
        data: {
          orderId: id,
          kind: "image",
          fileName,
          originalName: fileName,
          mimeType,
          size: buffer.length,
          data: buffer,
        },
      });
      await refreshHasDetail(id);
      return NextResponse.json({
        id: media.id,
        url: `/api/admin/orders/${id}/media/${media.id}`,
        name: media.fileName,
        originalName: media.originalName,
        size: media.size,
      });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const originalName = file.name || "file.pdf";
    const mimeType = file.type || "application/pdf";
    const isPdf =
      mimeType === "application/pdf" ||
      originalName.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { error: "PDF 파일만 첨부할 수 있습니다." },
        { status: 400 },
      );
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF는 15MB 이하만 첨부할 수 있습니다." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await prisma.orderMedia.create({
      data: {
        orderId: id,
        kind: "pdf",
        fileName: originalName,
        originalName,
        mimeType: "application/pdf",
        size: buffer.length,
        data: buffer,
      },
    });
    await refreshHasDetail(id);

    return NextResponse.json({
      id: media.id,
      url: `/api/admin/orders/${id}/media/${media.id}`,
      name: media.fileName,
      originalName: media.originalName,
      size: media.size,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
