import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "회사소개",
  description: "MZ Generation's Marketing Zone, 엠지미디어 회사소개.",
};

const values = [
  {
    title: "로컬 감각",
    text: "전국 템플릿이 아니라, 대구·경북 시장과 고객 언어를 기준으로 콘텐츠를 만듭니다.",
  },
  {
    title: "실행 중심",
    text: "멋진 기획서보다 매주 나가는 콘텐츠와 측정 가능한 변화를 우선합니다.",
  },
  {
    title: "솔직한 리포트",
    text: "잘된 점과 부족한 점을 함께 공유하고, 다음 액션을 명확히 제안합니다.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={`${site.nameKo}는 로컬 브랜드의 마케팅 존입니다`}
        description="MZ Generation's Marketing Zone. 블로그·SNS·유튜브로 브랜드가 실제로 움직이도록, 전략과 제작과 운영을 한곳에서 이어갑니다."
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              다르게 생각하되,
              <br />
              꾸준히 실행합니다
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              마케팅은 한 번의 캠페인이 아니라, 고객이 브랜드를 만나는 반복입니다.
              엠지미디어는 검색·소셜·영상 채널을 느슨하게 나열하지 않고, 서로의
              역할을 나눠 로컬 비즈니스의 성장을 설계합니다.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              소상공인 매장부터 지역 기반 서비스 기업까지, “무엇을 올려야 하는지”
              가 아니라 “왜 올리는지”부터 함께 정리합니다.
            </p>
          </Reveal>

          <Reveal delay={2}>
            <div className="rounded-[2rem] border border-line bg-paper p-8">
              <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
                Identity
              </p>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm text-muted">브랜드</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">
                    {site.name} / {site.nameKo}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">슬로건</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">
                    {site.tagline}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">거점</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">
                    대구 · 경북
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">핵심 영역</dt>
                  <dd className="mt-1 text-lg font-semibold text-ink">
                    블로그 · SNS · 유튜브 · 마케팅 강의
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-20 md:py-24">
        <div className="site-shell">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-ink">일하는 기준</h2>
            <p className="mt-3 max-w-2xl text-muted">
              화려한 말보다, 현장에서 통하는 콘텐츠와 투명한 보고를 기준으로
              삼습니다.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={(index + 1) as 1 | 2 | 3}>
                <article className="h-full rounded-[1.5rem] border border-line bg-white p-6">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {value.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12">
            <Link
              href="/quote"
              className="inline-flex rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              협업 문의하기
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
