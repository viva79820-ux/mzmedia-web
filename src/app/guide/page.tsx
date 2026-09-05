import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "이용방법",
  description:
    "서비스 선택부터 견적 문의, 상담 확정까지 엠지미디어 이용 흐름을 안내합니다.",
};

const steps = [
  {
    num: "01",
    title: "서비스 선택",
    text: "온라인마케팅, 영상·촬영, 홈페이지·IT, 디자인·인쇄 중 필요한 상품을 고릅니다.",
  },
  {
    num: "02",
    title: "작업 조건 입력",
    text: "분량·기간·옵션 등 견적에 영향을 주는 조건을 입력합니다.",
  },
  {
    num: "03",
    title: "예상 견적 확인",
    text: "예상 제작비와 제작기간을 확인합니다. 표시 금액은 참고용이며 최종은 상담 후 확정됩니다.",
  },
  {
    num: "04",
    title: "문의 제출",
    text: "연락처와 요구사항을 남기면 견적 문의가 접수됩니다. 회원가입·결제는 필요 없습니다.",
  },
  {
    num: "05",
    title: "상담·확정",
    text: "엠지미디어가 내용을 확인한 뒤 최종 범위와 일정을 함께 맞춥니다.",
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Guide"
        title="이용방법"
        description="상품을 고르고 예상 견적을 본 뒤 문의하면, 엠지미디어가 확인 후 상담드립니다."
        cta={{ href: "/estimate", label: "빠른 견적받기" }}
      />

      <section className="bg-white py-16 md:py-20">
        <div className="site-shell">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <Reveal key={step.num} delay={Math.min(index + 1, 3) as 1 | 2 | 3}>
                <article className="h-full border-t-2 border-ink pt-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-accent">
                    {step.num}
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-line bg-paper p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-ink">
                영상으로 보기
              </h2>
              <p className="mt-2 text-sm text-muted">
                이용 안내 영상이 준비되면 이 영역에 연결됩니다.
              </p>
              <div className="mt-5 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-line bg-white text-sm text-muted">
                YouTube 안내 영상 자리
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-ink">
                바로 시작하기
              </h2>
              <p className="mt-2 text-sm text-muted">
                어떤 상품이 맞는지 모르겠다면 빠른 견적에서 서비스를 고른 뒤
                문의하셔도 됩니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep"
                >
                  서비스 선택
                </Link>
                <Link
                  href="/estimate"
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink"
                >
                  빠른 견적
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
