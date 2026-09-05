import type { MetadataRoute } from "next";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/guide",
    "/services",
    "/estimate",
    "/jobs",
    "/lectures",
    "/lectures/online",
    "/lectures/offline",
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    await ensureCatalogSeeded();
    const categories = await prisma.serviceCategory.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    const products = await prisma.serviceProduct.findMany({
      where: { published: true, category: { published: true } },
      select: {
        slug: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
    });

    for (const category of categories) {
      entries.push({
        url: `${site.url}/services/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const product of products) {
      entries.push({
        url: `${site.url}/services/${product.category.slug}/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch {
    // DB 미연결 시 정적 라우트만 반환
  }

  return entries;
}
