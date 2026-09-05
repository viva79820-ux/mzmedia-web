import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ensureCatalogSeeded } from "@/lib/catalog-db";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const fallbackCategories = [
  {
    slug: "online-marketing",
    name: "온라인마케팅",
    description: "블로그·SNS·광고 운영과 콘텐츠 제작",
  },
  {
    slug: "video",
    name: "영상·촬영",
    description: "기업·행사·숏폼 영상 기획부터 편집까지",
  },
  {
    slug: "web-it",
    name: "홈페이지·IT",
    description: "웹사이트·시스템·앱·자동화 개발",
  },
  {
    slug: "design-print",
    name: "디자인·인쇄",
    description: "디자인 제작과 인쇄물 제작",
  },
];

export default async function HomePage() {
  let categories = fallbackCategories;
  try {
    await ensureCatalogSeeded();
    const rows = await prisma.serviceCategory.findMany({
      where: { published: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 4,
    });
    if (rows.length > 0) {
      categories = rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: row.description,
      }));
    }
  } catch {
    // DB 미연결 시에도 홈은 정적 카탈로그 안내를 유지
  }

  return (
    <>
      <section className="relative min-h-[min(100svh,880px)] overflow-hidden">
        <Image
          src="/images/hero-studio.jpg"
          alt="엠지미디어 마케팅 스튜디오"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,20,26,0.82)_0%,rgba(16,20,26,0.55)_48%,rgba(16,20,26,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(26,74,172,0.28),transparent_42%)]" />

        <div className="site-shell relative z-[2] flex min-h-[min(100svh,880px)] flex-col justify-end pb-16 pt-28 md:justify-center md:pb-24 md:pt-24">
          <p className="animate-rise font-display text-sm font-semibold tracking-[0.28em] text-white/75 uppercase md:text-base">
            {site.name}
          </p>
          <h1 className="animate-rise animate-rise-delay-1 font-display mt-4 max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight text-white md:text-6xl">
            마케팅·영상·홈페이지·디자인,
            <br />
            <span className="relative inline-block">
              한곳에서 견적받으세요
              <span className="underline-sweep absolute -bottom-1 left-0 h-2 w-full bg-accent/90" />
            </span>
          </h1>
          <p className="animate-rise animate-rise-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            서비스를 고르고 작업 조건을 입력하면 예상 견적을 확인할 수 있습니다.
            최종 범위는 상담 후 확정됩니다.
          </p>
          <div className="animate-rise animate-rise-delay-3 mt-9 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              서비스 선택
            </Link>
            <Link
              href="/estimate"
              className="rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              빠른 견적받기
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              회사소개
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white py-20 md:py-24">
        <div className="site-shell">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
              Services
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              필요한 서비스를 선택하세요
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              상품을 고른 뒤 옵션을 입력하면 예상 견적과 함께 문의할 수 있습니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Reveal key={category.slug} delay={(Math.min(index + 1, 3) as 1 | 2 | 3)}>
                <Link
                  href={`/services/${category.slug}`}
                  className="block h-full border-t-2 border-ink pt-6 transition hover:border-accent"
                >
                  <h3 className="font-display text-xl font-bold text-ink">
                    {category.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {category.description}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-accent">
                    상품 보기 →
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="noise relative overflow-hidden bg-ink py-20 text-white md:py-24">
        <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="site-shell relative z-[2]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">
              How it works
            </p>
            <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              선택 → 견적 → 문의 → 상담
            </h2>
            <p className="mt-3 max-w-2xl text-white/65">
              회원가입·결제 없이, 지금 단계에서 필요한 문의만 남기면 됩니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "서비스 선택", "카탈로그에서 필요한 상품을 고릅니다."],
              ["02", "조건 입력", "분량·옵션 등 작업 조건을 입력합니다."],
              ["03", "예상 견적", "참고용 예상 금액과 기간을 확인합니다."],
              ["04", "문의·상담", "제출 후 엠지미디어가 최종 확인합니다."],
            ].map(([num, title, text], index) => (
              <Reveal key={num} delay={Math.min(index + 1, 3) as 1 | 2 | 3}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="font-display text-sm font-bold tracking-[0.16em] text-accent">
                    {num}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <Link
              href="/guide"
              className="inline-flex text-sm font-semibold text-white/80 hover:text-white"
            >
              이용방법 자세히 보기 →
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell">
          <Reveal>
            <div className="rounded-[2rem] bg-[linear-gradient(120deg,#0f1724_0%,#1a4aac_100%)] px-8 py-12 text-white md:px-12 md:py-14">
              <p className="font-display text-sm font-semibold tracking-[0.22em] text-white/55 uppercase">
                Estimate
              </p>
              <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                지금 바로 예상 견적을
                <br />
                확인해 보세요
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                상품을 고르고 조건을 입력하면 문의까지 한 번에 이어집니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/estimate"
                  className="inline-flex rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  빠른 견적받기
                </Link>
                <Link
                  href="/services"
                  className="inline-flex rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  서비스 둘러보기
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
