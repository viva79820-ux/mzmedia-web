import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

export function PageHero({ eyebrow, title, description, cta }: PageHeroProps) {
  return (
    <section className="noise relative overflow-hidden border-b border-line bg-[linear-gradient(135deg,#eef1f5_0%,#e2e7ee_48%,#d8efe8_100%)]">
      <div className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-teal/20 blur-3xl" />
      <div className="site-shell relative z-[2] py-16 md:py-20">
        <p className="animate-rise text-xs font-semibold tracking-[0.22em] text-teal uppercase">
          {eyebrow}
        </p>
        <h1 className="animate-rise animate-rise-delay-1 font-display mt-4 max-w-3xl text-4xl leading-[1.12] font-bold tracking-tight text-ink md:text-5xl">
          {title}
        </h1>
        <p className="animate-rise animate-rise-delay-2 mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          {description}
        </p>
        {cta && (
          <div className="animate-rise animate-rise-delay-3 mt-8">
            <Link
              href={cta.href}
              className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
