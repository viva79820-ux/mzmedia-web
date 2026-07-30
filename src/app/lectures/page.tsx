import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "강의",
  description: "엠지미디어 온라인·오프라인 마케팅 강의 안내.",
};

const tracks = [
  {
    href: "/lectures/online",
    title: "온라인 강의",
    desc: "언제 어디서나 따라가는 실무형 마케팅 커리큘럼.",
    image: "/images/lecture-online.jpg",
    imageAlt: "온라인 강의 학습 환경",
  },
  {
    href: "/lectures/offline",
    title: "오프라인 강의",
    desc: "현장에서 바로 적용하는 워크숍형 대면 강의.",
    image: "/images/lecture-offline.jpg",
    imageAlt: "오프라인 강의실",
  },
];

export default function LecturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Lectures"
        title="마케팅을 배우는 가장 빠른 방법"
        description="운영 대행만이 아니라, 직접 이해하고 실행할 수 있도록 온·오프라인 강의를 제공합니다."
      />

      <section className="bg-white py-20 md:py-24">
        <div className="site-shell grid gap-8 lg:grid-cols-2">
          {tracks.map((track, index) => (
            <Reveal key={track.href} delay={(index + 1) as 1 | 2}>
              <Link
                href={track.href}
                className="group block overflow-hidden rounded-[1.75rem] border border-line bg-paper transition hover:border-ink/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={track.image}
                    alt={track.imageAlt}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="p-7">
                  <h2 className="font-display text-2xl font-bold text-ink">
                    {track.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{track.desc}</p>
                  <p className="mt-5 text-sm font-semibold text-accent">
                    자세히 보기 →
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
