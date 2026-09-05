import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EstimateWidget } from "@/components/EstimateWidget";
import { PageHero } from "@/components/PageHero";
import {
  SALE_MODE_LABEL,
  formatPriceLabel,
  parseEstimateRule,
  parseFaqItems,
  parseStringList,
  type SaleMode,
} from "@/lib/catalog";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  await ensureCatalogSeeded();
  const product = await prisma.serviceProduct.findFirst({
    where: {
      slug,
      published: true,
      category: { slug: categorySlug, published: true },
    },
  });
  if (!product) return { title: "서비스" };
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.summary,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.summary,
      images: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    },
  };
}

export default async function ServiceProductPage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  await ensureCatalogSeeded();
  const product = await prisma.serviceProduct.findFirst({
    where: {
      slug,
      published: true,
      category: { slug: categorySlug, published: true },
    },
    include: { category: true },
  });
  if (!product) notFound();

  const scopeItems = parseStringList(product.scopeItems);
  const clientMaterials = parseStringList(product.clientMaterials);
  const processSteps = parseStringList(product.processSteps);
  const faqItems = parseFaqItems(product.faqItems);
  const rule = parseEstimateRule(product.estimateRule);

  return (
    <>
      <PageHero
        eyebrow={product.category.name}
        title={product.name}
        description={product.summary || product.description}
      />
      <section className="bg-white py-14 md:py-20">
        <div className="site-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[1.5rem] border border-line bg-paper-deep">
              <div className="aspect-[16/9]">
                {product.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    MZ MEDIA
                  </div>
                )}
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-paper p-4">
                <dt className="text-xs text-muted">시작가격</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {formatPriceLabel(product.startingPrice)}
                </dd>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-4">
                <dt className="text-xs text-muted">제작기간</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {product.durationLabel || "상담 후 확정"}
                </dd>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-4">
                <dt className="text-xs text-muted">판매방식</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {SALE_MODE_LABEL[product.saleMode as SaleMode]}
                </dd>
              </div>
            </dl>

            {product.description && (
              <section>
                <h2 className="font-display text-xl font-bold text-ink">소개</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {product.description}
                </p>
              </section>
            )}

            {scopeItems.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-ink">
                  기본 제공범위
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {scopeItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            {clientMaterials.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-ink">
                  고객 준비자료
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {clientMaterials.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-display text-xl font-bold text-ink">
                기본 수정 횟수
              </h2>
              <p className="mt-3 text-sm text-muted">
                {product.revisionCount || "상담 후 확정"}
              </p>
            </section>

            {processSteps.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-ink">
                  작업 진행 과정
                </h2>
                <ol className="mt-3 space-y-2 text-sm text-ink-soft">
                  {processSteps.map((item, index) => (
                    <li key={item}>
                      {index + 1}. {item}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section>
              <h2 className="font-display text-xl font-bold text-ink">
                관련 포트폴리오
              </h2>
              <p className="mt-3 text-sm text-muted">
                등록된 포트폴리오가 있으면 이 영역에 연결됩니다.
              </p>
            </section>

            {faqItems.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold text-ink">FAQ</h2>
                <div className="mt-3 space-y-3">
                  {faqItems.map((item) => (
                    <details
                      key={item.q}
                      className="rounded-2xl border border-line bg-paper px-4 py-3"
                    >
                      <summary className="cursor-pointer font-medium text-ink">
                        {item.q}
                      </summary>
                      <p className="mt-2 text-sm text-muted">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div>
            <EstimateWidget
              productId={product.id}
              productName={product.name}
              saleMode={product.saleMode as SaleMode}
              rule={rule}
            />
          </div>
        </div>
      </section>
    </>
  );
}
