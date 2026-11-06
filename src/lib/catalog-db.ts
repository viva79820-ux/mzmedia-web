import { prisma } from "@/lib/db";
import { emptyEstimateRule } from "@/lib/catalog";
import { CATALOG_SEED } from "@/lib/catalog-seed";

async function syncPublishedCatalog() {
  const video = CATALOG_SEED.find((category) => category.slug === "video");
  if (video) {
    await prisma.serviceCategory.updateMany({
      where: { slug: video.slug },
      data: { name: video.name, description: video.description },
    });
  }

  const live = CATALOG_SEED.find((category) => category.slug === "youtube-live");
  if (!live) return;
  const existing = await prisma.serviceCategory.findUnique({ where: { slug: live.slug } });
  if (existing) {
    await prisma.serviceCategory.update({
      where: { id: existing.id },
      data: {
        name: live.name,
        description: live.description,
        sortOrder: live.sortOrder,
        published: true,
      },
    });
    return;
  }

  const created = await prisma.serviceCategory.create({
    data: {
      slug: live.slug,
      name: live.name,
      description: live.description,
      sortOrder: live.sortOrder,
      published: true,
    },
  });
  for (const [index, product] of live.products.entries()) {
    await prisma.serviceProduct.create({
      data: {
        categoryId: created.id,
        slug: product.slug,
        name: product.name,
        summary: product.summary,
        saleMode: product.saleMode,
        startingPrice: product.startingPrice ?? null,
        durationLabel: product.durationLabel ?? "",
        scopeItems: product.scopeItems ?? [],
        estimateRule: product.estimateRule ?? emptyEstimateRule(),
        published: true,
        sortOrder: index + 1,
        metaTitle: `${product.name} | 엠지미디어`,
        metaDescription: product.summary,
      },
    });
  }
}

export async function ensureCatalogSeeded() {
  const count = await prisma.serviceCategory.count();
  if (count > 0) {
    await syncPublishedCatalog();
    return { seeded: false };
  }

  for (const category of CATALOG_SEED) {
    const created = await prisma.serviceCategory.create({
      data: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        published: true,
      },
    });

    for (const [index, product] of category.products.entries()) {
      await prisma.serviceProduct.create({
        data: {
          categoryId: created.id,
          slug: product.slug,
          name: product.name,
          summary: product.summary,
          saleMode: product.saleMode,
          startingPrice: product.startingPrice ?? null,
          durationLabel: product.durationLabel ?? "",
          scopeItems: product.scopeItems ?? [],
          estimateRule: product.estimateRule ?? emptyEstimateRule(),
          published: true,
          sortOrder: index + 1,
          metaTitle: `${product.name} | 엠지미디어`,
          metaDescription: product.summary,
        },
      });
    }

    for (const child of category.children ?? []) {
      const childCat = await prisma.serviceCategory.create({
        data: {
          slug: child.slug,
          name: child.name,
          description: child.description,
          sortOrder: child.sortOrder,
          published: true,
          parentId: created.id,
        },
      });

      for (const [index, product] of child.products.entries()) {
        await prisma.serviceProduct.create({
          data: {
            categoryId: childCat.id,
            slug: product.slug,
            name: product.name,
            summary: product.summary,
            saleMode: product.saleMode,
            startingPrice: product.startingPrice ?? null,
            durationLabel: product.durationLabel ?? "",
            scopeItems: product.scopeItems ?? [],
            estimateRule: product.estimateRule ?? emptyEstimateRule(),
            published: true,
            sortOrder: index + 1,
            metaTitle: `${product.name} | 엠지미디어`,
            metaDescription: product.summary,
          },
        });
      }
    }
  }

  return { seeded: true };
}
