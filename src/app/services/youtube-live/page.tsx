import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "유튜브 중계",
  description: "행사, 강연, 매장 현장을 유튜브로 실시간 중계합니다. 범위와 금액은 상담 후 확정입니다.",
};

export default function YoutubeLivePage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="유튜브 중계"
        description="현장 영상을 유튜브로 실시간 중계합니다. 송출 범위, 장비, 일정, 금액은 상담 후 확정입니다."
        cta={{ href: "/estimate", label: "빠른 견적받기" }}
      />
      <section className="bg-white py-16">
        <div className="site-shell max-w-3xl">
          <p className="text-sm leading-7 text-ink-soft">
            행사, 강연, 매장 현장을 유튜브 시청자에게 바로 보낼 때 사용합니다. 이 화면에서 금액이나 월 수량을 확정하지 않습니다.
          </p>
          <Link href="/inquiries" className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">
            1:1 문의
          </Link>
        </div>
      </section>
    </>
  );
}
