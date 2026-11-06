import { site } from "@/lib/site";

export function LegalDraft({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper py-12 md:py-16">
      <div className="site-shell max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent">초안 · 시행 전</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {site.nameKo} 회원가입에 넣기 위한 초안입니다. 대표가 확인하고 고치기 전에는 시행 문서가 아닙니다.
          사업자등록번호와 정확한 시행일은 비워 두었습니다.
        </p>
        <article className="mt-8 space-y-6 text-sm leading-7 text-ink-soft">{children}</article>
        <p className="mt-10 text-sm leading-6 text-ink">
          {site.nameKo} · 대표 {site.representative}
          <br />
          {site.address}
          <br />
          {site.phone} · {site.email}
        </p>
      </div>
    </section>
  );
}
