import { prisma } from "@/lib/db";
import { emptyEstimateRule } from "@/lib/catalog";
import { CATALOG_SEED } from "@/lib/catalog-seed";

export async function ensureCatalogSeeded() {
  const count = await prisma.serviceCategory.count();
  if (count > 0) return { seeded: false };

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
