import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "서비스",
  description:
    "블로그, SNS, 유튜브 마케팅. 대구·경북 로컬 브랜드를 위한 엠지미디어 서비스.",
};

const packages = [
  {
    title: "블로그 마케팅",
    summary: "검색에서 발견되고, 문의로 이어지는 콘텐츠 운영",
    items: [
      "업종·지역 키워드 리서치",
      "주간 포스팅 기획 및 원고 작성",
      "썸네일·본문 이미지 제작",
      "상위노출 모니터링 및 월간 리포트",
    ],
  },
  {
    title: "SNS 마케팅",
    summary: "브랜드 톤을 고정하고, 팔로워와 반응을 키우는 운영",
    items: [
      "계정 진단 및 콘텐츠 톤 가이드",
      "피드·릴스·스토리 콘텐츠 제작",
      "해시태그·발행 루틴 설계",
      "댓글·DM 반응 관리 지원",
    ],
  },
  {
    title: "유튜브 마케팅",
    summary: "기획부터 편집까지, 신뢰형 영상 채널 구축",
    items: [
      "채널 콘셉트·시리즈 기획",
      "콘티 작성 및 촬영 디렉팅",
      "편집·자막·썸네일 제작",
      "업로드 전략 및 성장 리포트",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="채널별 역할이 다른 마케팅을, 한팀에서"
        description="검색은 블로그, 관계는 SNS, 신뢰는 유튜브. 엠지미디어는 로컬 비즈니스에 맞는 채널 조합으로 실행합니다."
        cta={{ href: "/quote", label: "맞춤 견적 받기" }}
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell space-y-16">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.title} delay={Math.min(index + 1, 3) as 1 | 2 | 3}>
              <article className="grid gap-8 border-t border-line pt-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="font-display text-sm font-bold tracking-[0.18em] text-accent">
                    0{index + 1}
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-bold text-ink">
                    {pkg.title}
                  </h2>
                  <p className="mt-3 text-muted">{pkg.summary}</p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {pkg.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-line bg-paper px-4 py-4 text-sm text-ink-soft"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-paper py-16">
        <div className="site-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
              어떤 조합이 맞을지 모르겠다면
            </h2>
            <p className="mt-2 text-muted">
              업종과 목표만 알려주셔도, 우선순위 채널을 함께 정해 드립니다.
            </p>
          </div>
          <Link
            href="/quote"
            className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white hover:bg-accent-deep"
          >
            견적안내로 이동
          </Link>
        </div>
      </section>
    </>
  );
}
