import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "@/components/QuoteForm";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "견적안내",
  description: "엠지미디어 마케팅·강의 견적 문의 안내.",
};

const guides = [
  {
    title: "운영 대행",
    text: "채널 수, 주간 발행량, 콘텐츠 제작 범위에 따라 월 구독형으로 산정합니다.",
  },
  {
    title: "단건 제작",
    text: "블로그 패키지, 릴스 묶음, 영상 1편 등 프로젝트 단위로도 가능합니다.",
  },
  {
    title: "강의",
    text: "온라인은 인원·모듈, 오프라인은 회차·장소·실습 구성에 따라 달라집니다.",
  },
];

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Quote"
        title="필요한 만큼만, 명확하게 견적드립니다"
        description="업종·목표·예산 범위를 알려주시면 영업일 기준 빠르게 안내드립니다. 과한 패키지보다 맞는 조합을 제안합니다."
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-ink">
                견적 기준
              </h2>
              <p className="mt-3 text-muted">
                정확한 금액은 상담 후 안내드리며, 아래 기준으로 범위를 먼저
                잡아드립니다.
              </p>
            </Reveal>
            <div className="mt-8 space-y-4">
              {guides.map((guide, index) => (
                <Reveal key={guide.title} delay={(index + 1) as 1 | 2 | 3}>
                  <article className="rounded-2xl border border-line bg-paper p-5">
                    <h3 className="font-semibold text-ink">{guide.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {guide.text}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-8 rounded-2xl border border-teal/20 bg-teal-soft p-5 text-sm text-ink-soft">
              <p>
                이메일{" "}
                <a className="font-semibold text-ink" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                <br />
                전화{" "}
                <a className="font-semibold text-ink" href={`tel:${site.phone}`}>
                  {site.phone}
                </a>
              </p>
            </Reveal>
          </div>

          <Reveal delay={2}>
            <QuoteForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
