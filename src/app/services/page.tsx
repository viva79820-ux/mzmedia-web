import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { ProductCard } from "@/components/ProductCard";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "서비스",
  description:
    "온라인마케팅, 영상·촬영, 홈페이지·IT, 디자인·인쇄 서비스를 한곳에서 견적받으세요.",
};

export const dynamic = "force-dynamic";

export default async function ServicesHubPage() {
  await ensureCatalogSeeded();
  const categories = await prisma.serviceCategory.findMany({
    where: { published: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: 3,
      },
      _count: { select: { products: true } },
      children: {
        where: { published: true },
        include: { _count: { select: { products: true } } },
      },
    },
  });

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="필요한 서비스를 선택하세요"
        description="마케팅·영상·홈페이지·디자인·인쇄까지, 상품을 고르고 예상 견적을 확인한 뒤 문의할 수 있습니다."
        cta={{ href: "/estimate", label: "빠른 견적받기" }}
      />
      <section className="bg-white py-16 md:py-20">
        <div className="site-shell grid gap-6 md:grid-cols-2">
          {categories.map((category) => {
            const productCount =
              category._count.products +
              category.children.reduce(
                (sum, child) => sum + child._count.products,
                0,
              );
            return (
              <Link
                key={category.id}
                href={`/services/${category.slug}`}
                className="rounded-[1.5rem] border border-line bg-paper p-6 transition hover:border-accent/40"
              >
                <p className="text-xs font-semibold tracking-[0.18em] text-teal uppercase">
                  Category
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                  {category.name}
                </h2>
                <p className="mt-2 text-sm text-muted">{category.description}</p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  상품 {productCount}개 보기 →
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
