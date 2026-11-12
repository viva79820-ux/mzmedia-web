import { portfolioHost, webPortfolio } from "@/lib/portfolio";

export function WebPortfolio({ heading = "홈페이지·IT 작업 사례" }: { heading?: string }) {
  return (
    <div id="portfolio">
      <p className="text-xs font-semibold tracking-[0.2em] text-teal uppercase">Portfolio</p>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">{heading}</h2>
      <p className="mt-3 max-w-2xl text-muted">
        학회 홈페이지, 마이페이지, 랜딩페이지, 앱을 제작한 사례입니다. 이름을 누르면 사이트로 이동합니다.
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {webPortfolio.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-[1.25rem] border border-line bg-white p-5 transition hover:border-accent/35"
            >
              <p className="text-xs font-semibold tracking-[0.14em] text-teal">{item.work}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{item.name}</h3>
              <p className="mt-4 text-sm font-semibold text-accent">{portfolioHost(item.href)} →</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
