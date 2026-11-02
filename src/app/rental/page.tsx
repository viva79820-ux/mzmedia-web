import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "장비 렌탈",
  description:
    "엠지미디어 장비 렌탈. 노트북, 모니터, 행사 음향, 방송 장비를 일정 확인 후 대여합니다.",
};

export default function RentalPage() {
  return (
    <section className="bg-white">
      <div className="site-shell flex flex-wrap items-end justify-between gap-4 py-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">
            Rental
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            장비 렌탈
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            노트북, 모니터, 행사 음향, 방송 장비를 필요한 기간만 대여합니다.
            문의는 일정 확인이며, 가용 장비와 비용을 안내한 뒤 계약과 결제가 되어야
            대여가 확정됩니다.
          </p>
        </div>
        <a
          href={site.rentalShopUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          새 창에서 열기
        </a>
      </div>
      <iframe
        title="모든렌탈 장비 목록"
        src={site.rentalShopUrl}
        className="h-[calc(100svh-4.5rem)] w-full border-t border-line bg-paper"
      />
    </section>
  );
}
