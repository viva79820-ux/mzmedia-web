import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "온라인 강의",
  description: "블로그·SNS·유튜브 실무를 온라인으로 배우는 엠지미디어 강의.",
};

const curriculum = [
  "검색 마케팅 기초와 키워드 설계",
  "블로그 글감·구조·이미지 실습",
  "인스타 콘텐츠 톤과 릴스 기획",
  "유튜브 콘티와 썸네일 원칙",
  "월간 리포트 읽는 법과 개선 루프",
];

export default function OnlineLecturePage() {
  return (
    <>
      <PageHero
        eyebrow="Online Lecture"
        title="자리에서 끝내는 실무형 온라인 강의"
        description="바쁜 사장님과 담당자를 위해, 바로 적용 가능한 마케팅 실무를 온라인으로 압축해 드립니다."
        cta={{ href: "/quote", label: "수강·커리큘럼 문의" }}
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem]">
              <Image
                src="/images/lecture-online.jpg"
                alt="온라인 강의"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Reveal>
          <Reveal delay={2}>
            <h2 className="font-display text-3xl font-bold text-ink">
              이런 분께 맞습니다
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
              <li>• 매장·브랜드 SNS를 직접 운영해야 하는 사장님</li>
              <li>• 대행 전, 마케팅 기본기를 잡고 싶은 담당자</li>
              <li>• 블로그·릴스·숏폼을 체계적으로 배우고 싶은 분</li>
            </ul>
            <p className="mt-6 text-sm text-ink-soft">
              녹화 강의 + 실습 체크리스트 형태로 구성되며, 일정과 패키지는 상담 후
              안내드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-20">
        <div className="site-shell">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-ink">커리큘럼 미리보기</h2>
          </Reveal>
          <ol className="mt-8 space-y-3">
            {curriculum.map((item, index) => (
              <Reveal key={item} delay={Math.min(index + 1, 3) as 1 | 2 | 3}>
                <li className="flex items-start gap-4 rounded-2xl border border-line bg-white px-5 py-4">
                  <span className="font-display text-sm font-bold text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-ink-soft md:text-base">{item}</span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white hover:bg-accent-deep"
            >
              온라인 강의 문의
            </Link>
            <Link
              href="/lectures/offline"
              className="rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink"
            >
              오프라인 강의 보기
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
