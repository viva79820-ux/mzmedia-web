import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "오프라인 강의",
  description: "대구·경북 현장형 마케팅 워크숍, 엠지미디어 오프라인 강의.",
};

const benefits = [
  {
    title: "현장 피드백",
    text: "내 업종 계정·키워드를 가져와 바로 피드백 받습니다.",
  },
  {
    title: "실습 중심",
    text: "이론보다 글감 잡기, 촬영 구도, 발행 루틴을 함께 만듭니다.",
  },
  {
    title: "로컬 네트워킹",
    text: "같은 지역 사장님·마케터와 사례를 나누며 시야를 넓힙니다.",
  },
];

export default function OfflineLecturePage() {
  return (
    <>
      <PageHero
        eyebrow="Offline Lecture"
        title="대구·경북에서 만나는 현장형 워크숍"
        description="화면 밖에서도 통하는 마케팅. 질문하고, 실습하고, 바로 적용하는 오프라인 강의입니다."
        cta={{ href: "/quote", label: "오프라인 일정 문의" }}
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
              강의실에서 끝나는 게 아니라,
              <br />
              매장으로 가져갑니다
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              오프라인 강의는 소규모 워크숍 형태로 진행됩니다. 참석 전 사전
              설문을 통해 업종과 목표를 파악하고, 당일에는 실습 비중을 높입니다.
            </p>
            <div className="mt-8 grid gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-line bg-paper px-5 py-4"
                >
                  <h3 className="font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-1 text-sm text-muted">{benefit.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem]">
              <Image
                src="/images/lecture-offline.jpg"
                alt="오프라인 강의실"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line bg-ink py-16 text-white">
        <div className="site-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              다음 오프라인 일정 받아보기
            </h2>
            <p className="mt-2 text-white/65">
              희망 주제와 인원을 남겨주시면 맞춤 일정을 안내드립니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white hover:bg-accent-deep"
            >
              일정·견적 문의
            </Link>
            <Link
              href="/lectures/online"
              className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white"
            >
              온라인 강의 보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
