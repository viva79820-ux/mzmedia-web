import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { emptyEstimateRule, type SaleMode } from "@/lib/catalog";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.summary === "string") data.summary = body.summary;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.thumbnailUrl === "string") data.thumbnailUrl = body.thumbnailUrl;
    if (typeof body.durationLabel === "string") data.durationLabel = body.durationLabel;
    if (typeof body.revisionCount === "string") data.revisionCount = body.revisionCount;
    if (typeof body.metaTitle === "string") data.metaTitle = body.metaTitle;
    if (typeof body.metaDescription === "string")
      data.metaDescription = body.metaDescription;
    if (typeof body.published === "boolean") data.published = body.published;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    if (Array.isArray(body.scopeItems)) data.scopeItems = body.scopeItems;
    if (Array.isArray(body.clientMaterials))
      data.clientMaterials = body.clientMaterials;
    if (Array.isArray(body.processSteps)) data.processSteps = body.processSteps;
    if (Array.isArray(body.faqItems)) data.faqItems = body.faqItems;
    if (body.estimateRule && typeof body.estimateRule === "object") {
      data.estimateRule = body.estimateRule;
    } else if (body.estimateRule === null) {
      data.estimateRule = emptyEstimateRule();
    }
    if (["FIXED", "AUTO", "CONSULT"].includes(String(body.saleMode))) {
      data.saleMode = String(body.saleMode) as SaleMode;
    }
    if ("startingPrice" in body) {
      const startingRaw = body.startingPrice;
      data.startingPrice =
        startingRaw === null ||
        startingRaw === undefined ||
        startingRaw === "" ||
        Number.isNaN(Number(startingRaw))
          ? null
          : Number(startingRaw);
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      data.slug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
    }
    if (typeof body.categoryId === "string" && body.categoryId) {
      data.categoryId = body.categoryId;
    }

    const product = await prisma.serviceProduct.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.serviceProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
