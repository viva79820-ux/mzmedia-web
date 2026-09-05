import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";
import { emptyEstimateRule, type SaleMode } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    await ensureCatalogSeeded();
    const categories = await prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        products: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            products: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
          },
        },
      },
      where: { parentId: null },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await ensureCatalogSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const categoryId = String(body.categoryId ?? "");
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const name = String(body.name ?? "").trim();
    if (!categoryId || !slug || !name) {
      return NextResponse.json(
        { ok: false, message: "카테고리, 슬러그, 상품명은 필수입니다." },
        { status: 400 },
      );
    }

    const saleMode = (["FIXED", "AUTO", "CONSULT"].includes(
      String(body.saleMode),
    )
      ? String(body.saleMode)
      : "CONSULT") as SaleMode;

    const startingRaw = body.startingPrice;
    const startingPrice =
      startingRaw === null ||
      startingRaw === undefined ||
      startingRaw === "" ||
      Number.isNaN(Number(startingRaw))
        ? null
        : Number(startingRaw);

    const created = await prisma.serviceProduct.create({
      data: {
        categoryId,
        slug,
        name,
        summary: String(body.summary ?? ""),
        description: String(body.description ?? ""),
        thumbnailUrl: String(body.thumbnailUrl ?? ""),
        saleMode,
        startingPrice,
        durationLabel: String(body.durationLabel ?? ""),
        scopeItems: Array.isArray(body.scopeItems) ? body.scopeItems : [],
        clientMaterials: Array.isArray(body.clientMaterials)
          ? body.clientMaterials
          : [],
        revisionCount: String(body.revisionCount ?? ""),
        processSteps: Array.isArray(body.processSteps) ? body.processSteps : [],
        faqItems: Array.isArray(body.faqItems) ? body.faqItems : [],
        estimateRule:
          body.estimateRule && typeof body.estimateRule === "object"
            ? body.estimateRule
            : emptyEstimateRule(),
        published: body.published !== false,
        sortOrder: Number(body.sortOrder ?? 0) || 0,
        metaTitle: String(body.metaTitle ?? `${name} | 엠지미디어`),
        metaDescription: String(body.metaDescription ?? body.summary ?? ""),
      },
    });

    return NextResponse.json({ ok: true, product: created });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "상품 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
