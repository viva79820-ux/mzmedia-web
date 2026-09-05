import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ProductCard } from "@/components/ProductCard";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  await ensureCatalogSeeded();
  const category = await prisma.serviceCategory.findUnique({
    where: { slug },
  });
  if (!category) return { title: "서비스" };
  return {
    title: category.name,
    description: category.description || `${category.name} 서비스 안내`,
  };
}

export default async function ServiceCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  await ensureCatalogSeeded();
  const category = await prisma.serviceCategory.findUnique({
    where: { slug },
    include: {
      products: {
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      children: {
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          products: {
            where: { published: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
      parent: true,
    },
  });

  if (!category || !category.published) notFound();

  return (
    <>
      <PageHero
        eyebrow={category.parent?.name ?? "Services"}
        title={category.name}
        description={category.description}
        cta={{ href: "/estimate", label: "빠른 견적받기" }}
      />
      <section className="bg-white py-14 md:py-20">
        <div className="site-shell space-y-12">
          {category.products.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/services/${category.slug}/${product.slug}`}
                  name={product.name}
                  summary={product.summary}
                  startingPrice={product.startingPrice}
                  thumbnailUrl={product.thumbnailUrl || undefined}
                />
              ))}
            </div>
          )}

          {category.children.map((child) => (
            <div key={child.id}>
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">
                    {child.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{child.description}</p>
                </div>
                <Link
                  href={`/services/${child.slug}`}
                  className="text-sm font-semibold text-accent"
                >
                  더보기 →
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {child.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    href={`/services/${child.slug}/${product.slug}`}
                    name={product.name}
                    summary={product.summary}
                    startingPrice={product.startingPrice}
                    thumbnailUrl={product.thumbnailUrl || undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
