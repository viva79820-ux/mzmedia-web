import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { QuickEstimateClient } from "@/components/QuickEstimateClient";
import {
  parseEstimateRule,
  type SaleMode,
} from "@/lib/catalog";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "빠른 견적",
  description:
    "원하는 서비스를 고르고 옵션을 선택한 뒤, 예상 견적과 함께 문의하세요.",
};

export const dynamic = "force-dynamic";

export default async function EstimatePage() {
  await ensureCatalogSeeded();
  const products = await prisma.serviceProduct.findMany({
    where: { published: true, category: { published: true } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { category: true },
  });

  const options = products.map((product) => ({
    id: product.id,
    name: product.name,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    saleMode: product.saleMode as SaleMode,
    rule: parseEstimateRule(product.estimateRule),
  }));

  return (
    <>
      <PageHero
        eyebrow="Estimate"
        title="빠른 견적받기"
        description="서비스를 선택한 뒤 작업 조건을 입력하면 예상 견적을 확인하고 바로 문의할 수 있습니다. 최종 금액은 상담 후 확정됩니다."
        cta={{ href: "/services", label: "서비스 둘러보기" }}
      />
      <section className="bg-white py-14 md:py-20">
        <div className="site-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold text-ink">
              이렇게 진행됩니다
            </h2>
            <ol className="space-y-3 text-sm text-ink-soft">
              <li>1. 필요한 서비스를 선택합니다.</li>
              <li>2. 작업 조건·옵션을 입력합니다.</li>
              <li>3. 예상 견적과 제작기간을 확인합니다.</li>
              <li>4. 연락처와 요구사항을 제출합니다.</li>
              <li>5. 엠지미디어가 확인 후 상담드립니다.</li>
            </ol>
            <p className="text-sm text-muted">
              상품별 상세 설명이 필요하면{" "}
              <Link href="/services" className="font-semibold text-accent">
                서비스 카탈로그
              </Link>
              에서 확인해 주세요.
            </p>
          </div>
          <QuickEstimateClient products={options} />
        </div>
      </section>
    </>
  );
}
