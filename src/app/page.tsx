import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

const services = [
  {
    title: "블로그 마케팅",
    desc: "검색 의도에 맞는 콘텐츠로 상위노출과 문의 전환을 만듭니다.",
    points: ["관리대행", "원고·이미지", "키워드 전략"],
  },
  {
    title: "SNS 마케팅",
    desc: "인스타그램·페이스북에서 브랜드 톤과 팔로워 반응을 함께 설계합니다.",
    points: ["계정 운영", "콘텐츠 제작", "반응 관리"],
  },
  {
    title: "유튜브 마케팅",
    desc: "기획부터 촬영·편집까지, 영상으로 신뢰를 쌓는 채널을 운영합니다.",
    points: ["콘티 기획", "촬영·편집", "채널 성장"],
  },
];

const steps = [
  {
    num: "01",
    title: "진단",
    text: "업종, 경쟁, 검색·SNS 현황을 빠르게 파악합니다.",
  },
  {
    num: "02",
    title: "설계",
    text: "목표 키워드와 콘텐츠 루틴을 한 장의 전략으로 정리합니다.",
  },
  {
    num: "03",
    title: "실행",
    text: "매주 발행·운영하며 반응이 좋은 포맷을 확장합니다.",
  },
  {
    num: "04",
    title: "보고",
    text: "월말 보고서로 성과와 다음 액션을 명확히 공유합니다.",
  },
];

export default function HomePage() {
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
            블로그 · 인스타그램 · 유튜브,
            <br />
            <span className="relative inline-block">
              이제 한 곳에서 한 번에!
              <span className="underline-sweep absolute -bottom-1 left-0 h-2 w-full bg-accent/90" />
            </span>
          </h1>
          <p className="animate-rise animate-rise-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            엠지미디어는 기업의 온라인 홍보를 위해 콘텐츠를 기획하고 제작하는
            콘텐츠 마케팅 전문기업입니다.
          </p>
          <div className="animate-rise animate-rise-delay-3 mt-9 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
            >
              견적 문의하기
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              서비스 살펴보기
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
              주력 분야
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              채널마다 역할이 다릅니다. 검색은 블로그로, 관계는 SNS로, 신뢰는
              유튜브로 쌓습니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={(index + 1) as 1 | 2 | 3}>
                <article className="h-full border-t-2 border-ink pt-6">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {service.desc}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                    {service.points.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <Link
              href="/services"
              className="inline-flex text-sm font-semibold text-accent hover:text-accent-deep"
            >
              서비스 상세 보기 →
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="noise relative overflow-hidden bg-ink py-20 text-white md:py-24">
        <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="site-shell relative z-[2]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">
              Process
            </p>
            <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              마케팅, 어떻게 하나요?
            </h2>
            <p className="mt-3 max-w-2xl text-white/65">
              막막한 마케팅을 진단부터 보고까지 한 흐름으로 정리합니다. 소상공인부터
              기업 브랜드까지 같은 기준으로 움직입니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Reveal key={step.num} delay={Math.min(index + 1, 3) as 1 | 2 | 3}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="font-display text-sm font-bold tracking-[0.16em] text-accent">
                    {step.num}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper py-20 md:py-24">
        <div className="site-shell grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
              Results
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              마케팅, 효과는 있나요?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              의미 없는 거품은 걷어내고, 성과로 이어지는 전략만 남깁니다. 월말
              보고서로 노출·반응·문의 흐름을 알기 쉽게 정리해 드립니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
              >
                회사소개 보기
              </Link>
              <Link
                href="/lectures"
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                강의 살펴보기
              </Link>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="animate-float relative overflow-hidden rounded-[2rem] border border-line bg-white p-8 shadow-[0_24px_60px_rgba(16,20,26,0.08)]">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-soft" />
              <p className="relative font-display text-5xl font-extrabold tracking-tight text-ink">
                월말 리포트
              </p>
              <p className="relative mt-4 text-sm leading-relaxed text-muted">
                어떤 콘텐츠가 검색을 끌었는지, 어떤 릴스가 저장을 만들었는지,
                다음 달에 무엇을 더할지까지 한 장으로 공유합니다.
              </p>
              <div className="relative mt-8 grid grid-cols-3 gap-3 text-center">
                {[
                  ["검색", "키워드"],
                  ["반응", "저장·공유"],
                  ["전환", "문의"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-paper px-3 py-4"
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell">
          <Reveal>
            <div className="rounded-[2rem] bg-[linear-gradient(120deg,#0f1724_0%,#1a4aac_100%)] px-8 py-12 text-white md:px-12 md:py-14">
              <p className="font-display text-sm font-semibold tracking-[0.22em] text-white/55 uppercase">
                Quote
              </p>
              <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
                우리 가게·브랜드에 맞는
                <br />
                견적부터 받아보세요
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                업종과 목표를 알려주시면, 필요한 채널만 골라 현실적인 운영안을
                제안드립니다.
              </p>
              <Link
                href="/quote"
                className="mt-8 inline-flex rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
              >
                견적안내 바로가기
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
